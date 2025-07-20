import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import EditorToolbar from './EditorToolbar';
import { useTheme } from '../contexts/ThemeContext';

const Editor = ({ content, onUpdate, onCursorMove, onMouseMove, editable = true, activeUsers = [], currentUserId, documentOwnerId, onSuggestionsChange, suggestions = [], onAcceptSuggestion, onRejectSuggestion, socket, documentId }) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showSuggestionButton, setShowSuggestionButton] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState({ from: 0, to: 0 });
  const [userSuggestions, setUserSuggestions] = useState([]);
  const editorRef = useRef(null);
  const { effectiveTheme } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        taskList: false,
        taskItem: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          if (node.type.name === 'paragraph') {
            return "Type '/' for commands or start writing...";
          }
          return 'Start typing...';
        },
        showOnlyWhenEditable: true,
      }),
      Underline,
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
    },
    onSelectionUpdate: ({ editor }) => {
      if (onCursorMove && editable) {
        const { from, to } = editor.state.selection;
        onCursorMove({ from, to });
      }
      
      // Handle text selection for collaborative suggestions
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      
      // Only show suggestions for other users (not document owner) and with meaningful text selection
      const isOtherUser = currentUserId !== documentOwnerId;
      const hasValidSelection = text && text.trim().length >= 3 && from !== to; // At least 3 characters
      const isCompleteWord = text && /\b\w+\b/.test(text.trim()); // Contains at least one complete word
      
      
      if (isOtherUser && hasValidSelection && isCompleteWord) {
        // Show suggestion button for selected text
        setSelectedText(text);
        setSelectedRange({ from, to });
        
        // Position the suggestion button to the side of selected text
        try {
          const startCoords = editor.view.coordsAtPos(from);
          const endCoords = editor.view.coordsAtPos(to);
          const editorRect = editor.view.dom.getBoundingClientRect();
          
          // Position to the right side of the selected text
          setSuggestionPosition({
            x: endCoords.right - editorRect.left + 10, // 10px margin from text
            y: startCoords.top - editorRect.top
          });
          setShowSuggestionButton(true);
        } catch (error) {
          console.error('Error positioning suggestion button:', error);
        }
      } else {
        // Hide suggestion button if conditions not met
        setShowSuggestionButton(false);
        setShowSuggestionModal(false);
        setSelectedText('');
        setSelectedRange({ from: 0, to: 0 });
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[600px] px-4 py-8 max-w-none notion-editor',
        style: 'font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; font-size: 16px; line-height: 1.6; color: #37352f; word-wrap: break-word; overflow-wrap: break-word;',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (event.key === '/') {
            const { selection } = view.state;
            const { from } = selection;
            const coords = view.coordsAtPos(from);
            const editorRect = view.dom.getBoundingClientRect();
            
            setSlashMenuPosition({
              x: coords.left - editorRect.left,
              y: coords.top - editorRect.top + 20
            });
            setShowSlashMenu(true);
          }
          return false;
        },
        mousemove: (view, event) => {
          if (onMouseMove && editable) {
            const rect = view.dom.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setMousePosition({ x, y });
            
            console.log('Editor mouse move:', { x, y, hasHandler: !!onMouseMove });
            
            if (onMouseMove) {
              onMouseMove({ x, y });
            }
          }
        },
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // Add collaborative suggestion
  const addSuggestion = (suggestionText) => {
    if (!selectedText || !suggestionText.trim()) return;
    
    const newSuggestion = {
      id: Date.now() + Math.random(),
      documentId: documentId,
      originalText: selectedText,
      suggestionText: suggestionText.trim(),
      userId: currentUserId,
      userName: activeUsers.find(u => u.userId === currentUserId)?.userName || 'Anonymous',
      range: selectedRange,
      timestamp: new Date().toISOString(),
      status: 'pending' // pending, approved, rejected
    };
    
    const updatedSuggestions = [...userSuggestions, newSuggestion];
    setUserSuggestions(updatedSuggestions);
    onSuggestionsChange?.(updatedSuggestions);
    
    // Emit suggestion to all users via socket (like comments)
    if (socket && documentId) {
      socket.emit('suggestion-added', {
        documentId: documentId,
        suggestion: newSuggestion
      });
      console.log('Suggestion emitted:', newSuggestion);
    }
    
    // Close the suggestion modal and button
    setShowSuggestionModal(false);
    setShowSuggestionButton(false);
    setSelectedText('');
    setSelectedRange({ from: 0, to: 0 });
    
    // Clear selection in editor
    if (editor) {
      editor.commands.setTextSelection(selectedRange.to);
    }
  };

  // Handle suggestion button click
  const handleSuggestionButtonClick = () => {
    setShowSuggestionButton(false);
    setShowSuggestionModal(true);
  };

  // Cancel suggestion
  const handleCancelSuggestion = () => {
    setShowSuggestionModal(false);
    setShowSuggestionButton(false);
    setSelectedText('');
    setSelectedRange({ from: 0, to: 0 });
    
    // Clear selection in editor
    if (editor) {
      editor.commands.setTextSelection(selectedRange.to);
    }
  };
  
  // Accept suggestion (only document owner)
  const acceptSuggestion = (suggestionId) => {
    const suggestion = (suggestions || userSuggestions).find(s => s.id === suggestionId);
    if (!suggestion || !editor) return;
    
    // Apply the suggestion to the document
    editor.chain().focus().insertContentAt(
      { from: suggestion.range.from, to: suggestion.range.to },
      suggestion.suggestionText
    ).run();
    
    // Use parent handler if available
    if (onAcceptSuggestion) {
      onAcceptSuggestion(suggestionId);
    } else {
      // Mark as approved
      const updatedSuggestions = userSuggestions.map(s => s.id === suggestionId ? { ...s, status: 'approved' } : s);
      setUserSuggestions(updatedSuggestions);
      onSuggestionsChange?.(updatedSuggestions);
    }
    
    // Emit suggestion status update via socket
    if (socket && documentId) {
      socket.emit('suggestion-resolved', {
        documentId,
        suggestionId,
        action: 'accepted'
      });
    }
  };
  
  // Reject suggestion (only document owner)
  const rejectSuggestion = (suggestionId) => {
    // Use parent handler if available
    if (onRejectSuggestion) {
      onRejectSuggestion(suggestionId);
    } else {
      const updatedSuggestions = userSuggestions.map(s => s.id === suggestionId ? { ...s, status: 'rejected' } : s);
      setUserSuggestions(updatedSuggestions);
      onSuggestionsChange?.(updatedSuggestions);
    }
    
    // Emit suggestion status update via socket
    if (socket && documentId) {
      socket.emit('suggestion-resolved', {
        documentId,
        suggestionId,
        action: 'rejected'
      });
    }
  };

  const handleSlashCommand = (command) => {
    setShowSlashMenu(false);
    if (editor) {
      editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });
      
      switch(command) {
        case 'h1':
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case 'h2':
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case 'bullet':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'ordered':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'task':
          editor.chain().focus().toggleTaskList().run();
          break;
        case 'code':
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case 'quote':
          editor.chain().focus().toggleBlockquote().run();
          break;
        case 'divider':
          editor.chain().focus().setHorizontalRule().run();
          break;
        default:
          break;
      }
    }
  };

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSlashMenu && !event.target.closest('.slash-menu')) {
        setShowSlashMenu(false);
      }
      if (showSuggestionModal && !event.target.closest('.suggestion-modal')) {
        handleCancelSuggestion();
      }
      if (showSuggestionButton && !event.target.closest('.suggestion-button')) {
        setShowSuggestionButton(false);
        setSelectedText('');
        setSelectedRange({ from: 0, to: 0 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSlashMenu, showSuggestionModal, showSuggestionButton]);

  // Suggestion Modal Component
  const SuggestionModal = () => {
    const [suggestionText, setSuggestionText] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (suggestionText.trim()) {
        addSuggestion(suggestionText);
        setSuggestionText('');
      }
    };

    // Adjust position if it goes off-screen
    const adjustedPosition = {
      x: Math.min(suggestionPosition.x, window.innerWidth - 320 - 20), // 320px width + 20px margin
      y: suggestionPosition.y
    };
    
    return (
      <div 
        className="suggestion-modal absolute z-50 bg-white border-2 border-blue-200 rounded-lg shadow-xl p-4 w-80"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-500">💡</span>
            <h3 className="text-sm font-medium text-gray-900">Suggest changes</h3>
          </div>
          <p className="text-xs text-gray-900 bg-gray-100 p-2 rounded font-medium">
            Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder="Type your suggestion here..."
            className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
            autoFocus
          />
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelSuggestion}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!suggestionText.trim()}
            >
              Add Suggestion
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full relative bg-white" ref={editorRef}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-2">
          <EditorToolbar editor={editor} />
          <button
            onClick={() => setShowSlashMenu(!showSlashMenu)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <span className="text-lg">⚡</span>
          </button>
        </div>
      </div>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div 
          className="slash-menu absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]"
          style={{
            left: `${slashMenuPosition.x}px`,
            top: `${slashMenuPosition.y}px`,
          }}
        >
          <div className="text-xs text-gray-500 mb-2 px-2">BLOCKS</div>
          <div className="space-y-1">
            <button
              onClick={() => handleSlashCommand('h1')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-lg font-bold text-gray-700">H1</span>
              <span className="text-sm text-gray-600">Large heading</span>
            </button>
            <button
              onClick={() => handleSlashCommand('h2')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-md font-bold text-gray-700">H2</span>
              <span className="text-sm text-gray-600">Medium heading</span>
            </button>
            <button
              onClick={() => handleSlashCommand('h3')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-sm font-bold text-gray-700">H3</span>
              <span className="text-sm text-gray-600">Small heading</span>
            </button>
            <button
              onClick={() => handleSlashCommand('bullet')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-gray-700">•</span>
              <span className="text-sm text-gray-600">Bullet list</span>
            </button>
            <button
              onClick={() => handleSlashCommand('ordered')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-gray-700">1.</span>
              <span className="text-sm text-gray-600">Numbered list</span>
            </button>
            <button
              onClick={() => handleSlashCommand('task')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-gray-700">☐</span>
              <span className="text-sm text-gray-600">Task list</span>
            </button>
            <button
              onClick={() => handleSlashCommand('code')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-gray-700 font-mono">&lt;/&gt;</span>
              <span className="text-sm text-gray-600">Code block</span>
            </button>
            <button
              onClick={() => handleSlashCommand('quote')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-gray-700">❝</span>
              <span className="text-sm text-gray-600">Quote</span>
            </button>
            <button
              onClick={() => handleSlashCommand('divider')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3"
            >
              <span className="text-gray-700">―</span>
              <span className="text-sm text-gray-600">Divider</span>
            </button>
          </div>
        </div>
      )}

      {/* Suggestion Button */}
      {showSuggestionButton && (
        <div 
          className="suggestion-button absolute z-40"
          style={{
            left: `${suggestionPosition.x}px`,
            top: `${suggestionPosition.y}px`,
          }}
        >
          <button
            onClick={handleSuggestionButtonClick}
            className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            title="Add suggestion"
          >
            <span className="text-sm">💡</span>
          </button>
        </div>
      )}

      {/* Collaborative Suggestion Modal */}
      {showSuggestionModal && <SuggestionModal />}


      {/* Live Cursor and Mouse Indicators */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {console.log('Active users for display:', activeUsers, 'Current user:', currentUserId)}
        {activeUsers && activeUsers.length > 0 && activeUsers.map((user) => {
          if (!user || user.userId === currentUserId) return null;
          
          console.log('Rendering user:', user.userId, 'mouse:', user.mousePosition, 'cursor:', user.cursorPosition);
          
          return (
            <div key={user.userId}>
              {/* Mouse Position Indicator */}
              {user.mousePosition && typeof user.mousePosition.x === 'number' && typeof user.mousePosition.y === 'number' && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${user.mousePosition.x}px`,
                    top: `${user.mousePosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                  }}
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  <div 
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 text-sm font-bold rounded-lg shadow-xl whitespace-nowrap border-2"
                    style={{
                      color: '#991b1b',
                      backgroundColor: '#fefce8',
                      borderColor: '#fecaca'
                    }}
                  >
                    {user.userName || `User ${user.userId}`}
                  </div>
                </div>
              )}
              
              {/* Cursor Position Indicator */}
              {user.cursorPosition && typeof user.cursorPosition.x === 'number' && typeof user.cursorPosition.y === 'number' && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${user.cursorPosition.x}px`,
                    top: `${user.cursorPosition.y}px`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 1001,
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-0.5 h-6 bg-blue-500 animate-pulse"></div>
                    <div className="ml-1 px-2 py-1 text-xs text-white bg-blue-500 rounded-md shadow-lg whitespace-nowrap">
                      {user.userName || `User ${user.userId}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor}
        className="tiptap-content"
      />

    </div>
  );
};

export default Editor;