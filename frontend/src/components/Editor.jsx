import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import EditorToolbar from './EditorToolbar';

const Editor = ({ content, onUpdate, onCursorMove, onMouseMove, editable = true, activeUsers = [], currentUserId, onTextSelect, comments = [] }) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [commentButtonPosition, setCommentButtonPosition] = useState({ x: 0, y: 0 });
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [showBlockCommentButton, setShowBlockCommentButton] = useState(false);
  const [blockCommentPosition, setBlockCommentPosition] = useState({ x: 0, y: 0 });
  const [showInlineComments, setShowInlineComments] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentId, setActiveCommentId] = useState(null);
  const editorRef = useRef(null);
  const selectionTimeout = useRef(null);

  // Convert Tiptap position to screen coordinates
  const convertPositionToCoords = (position) => {
    if (!editor || !position || !editor.view) return null;
    
    try {
      // Ensure position is valid
      if (typeof position.from !== 'number' || position.from < 0) {
        return null;
      }
      
      // Check if position is within document bounds
      const docSize = editor.view.state.doc.content.size;
      if (position.from > docSize) {
        return null;
      }
      
      const coords = editor.view.coordsAtPos(position.from);
      
      // Validate coordinates
      if (typeof coords.left !== 'number' || typeof coords.top !== 'number') {
        return null;
      }
      
      return {
        x: Math.max(0, coords.left),
        y: Math.max(0, coords.top)
      };
    } catch (error) {
      console.warn('Error converting position to coords:', error);
      return null;
    }
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we're adding separately to avoid duplicates
        taskList: false,
        taskItem: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          if (node.type.name === 'paragraph') {
            return "Type '/' for commands, '#' for suggestions, or just start writing...";
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
        
        // Clear previous timeout
        if (selectionTimeout.current) {
          clearTimeout(selectionTimeout.current);
        }
        
        // Handle text selection for comments
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText.trim() && from !== to && (to - from) > 0) {
          // Check if we're selecting an entire block
          const $from = editor.state.doc.resolve(from);
          const $to = editor.state.doc.resolve(to);
          
          // Better block selection detection
          const isBlockSelection = $from.parent === $to.parent && 
                                 $from.parentOffset === 0 && 
                                 $to.parentOffset === $to.parent.content.size;
          
          setSelectedText(selectedText);
          
          // Show comment button with better positioning
          selectionTimeout.current = setTimeout(() => {
            const coords = editor.view.coordsAtPos(to);
            const editorRect = editor.view.dom.getBoundingClientRect();
            
            setCommentButtonPosition({ 
              x: coords.left - editorRect.left, 
              y: coords.top - editorRect.top 
            });
            setShowCommentButton(true);
            
            // Notify parent about text selection
            if (onTextSelect) {
              onTextSelect(selectedText, { from, to }, 'suggestion', isBlockSelection ? 'block' : 'text');
            }
          }, 100);
        } else {
          setSelectedText('');
          setShowCommentButton(false);
        }
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
            const coords = view.coordsAtPos(selection.from);
            setSlashMenuPosition({ x: coords.left, y: coords.bottom });
            setShowSlashMenu(true);
          } else if (event.key === '#') {
            // Handle comment creation with #
            const { selection } = view.state;
            const coords = view.coordsAtPos(selection.from);
            const rect = view.dom.getBoundingClientRect();
            
            // Create inline suggestion input
            const commentId = Date.now().toString();
            setCommentInputs(prev => ({
              ...prev,
              [commentId]: {
                position: { x: coords.left - rect.left, y: coords.top - rect.top },
                text: '',
                from: selection.from,
                to: selection.to,
                type: 'suggestion'
              }
            }));
            setActiveCommentId(commentId);
            
            // Prevent the # from being typed
            event.preventDefault();
            return true;
          } else if (event.key === 'Escape') {
            setShowSlashMenu(false);
            setShowCommentButton(false);
            setActiveCommentId(null);
            setCommentInputs({});
          }
          return false;
        },
        mousemove: (view, event) => {
          if (onMouseMove && editable) {
            const rect = view.dom.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setMousePosition({ x, y });
            
            // Enhanced block hover detection for suggestions
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (pos && pos.pos >= 0) {
              try {
                const $pos = view.state.doc.resolve(pos.pos);
                const blockDepth = $pos.depth;
                
                // Find the deepest block node (paragraph, heading, etc.)
                let blockNode = null;
                let blockStart = 0;
                let blockEnd = 0;
                
                for (let i = blockDepth; i >= 1; i--) {
                  const node = $pos.node(i);
                  if (node.type.name !== 'doc' && node.isBlock) {
                    blockNode = node;
                    blockStart = $pos.start(i);
                    blockEnd = $pos.end(i);
                    break;
                  }
                }
                
                // Only show block suggestion button if not currently selecting text
                if (view.state.selection.empty && blockNode && blockNode.type.name !== 'doc') {
                  const startCoords = view.coordsAtPos(blockStart);
                  const endCoords = view.coordsAtPos(blockEnd);
                  
                  // Calculate block dimensions with proper sizing
                  const blockInfo = {
                    node: blockNode,
                    start: blockStart,
                    end: blockEnd,
                    coords: {
                      left: Math.min(startCoords.left, endCoords.left) - rect.left,
                      top: Math.min(startCoords.top, endCoords.top) - rect.top,
                      right: Math.max(startCoords.right, endCoords.right) - rect.left,
                      bottom: Math.max(startCoords.bottom, endCoords.bottom) - rect.top,
                      width: Math.max(Math.abs(endCoords.right - startCoords.left), 200),
                      height: Math.max(Math.abs(endCoords.bottom - startCoords.top), 24)
                    }
                  };
                  
                  setHoveredBlock(blockInfo);
                  setBlockCommentPosition({ 
                    x: Math.max(blockInfo.coords.left - 50, 10), 
                    y: blockInfo.coords.top + (blockInfo.coords.height / 2) - 16
                  });
                  setShowBlockCommentButton(true);
                } else {
                  setHoveredBlock(null);
                  setShowBlockCommentButton(false);
                }
              } catch (error) {
                console.warn('Error in block hover detection:', error);
                setHoveredBlock(null);
                setShowBlockCommentButton(false);
              }
            }
            
            // Send relative position to document container
            const documentContainer = document.querySelector('.editor-document-container');
            if (documentContainer) {
              const containerRect = documentContainer.getBoundingClientRect();
              const relativeX = event.clientX - containerRect.left;
              const relativeY = event.clientY - containerRect.top;
              onMouseMove({ x: relativeX, y: relativeY });
            } else {
              onMouseMove({ x: event.clientX, y: event.clientY });
            }
          }
          return false;
        },
        mouseleave: (view, event) => {
          setHoveredBlock(null);
          setShowBlockCommentButton(false);
          return false;
        },
        click: (view, event) => {
          // Handle block selection for comments
          if (event.target.closest('.block-suggestion-btn')) {
            return true;
          }
          
          // Handle block selection by clicking on blocks
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (pos && pos.pos >= 0) {
            const $pos = view.state.doc.resolve(pos.pos);
            const blockDepth = $pos.depth;
            
            for (let i = blockDepth; i >= 1; i--) {
              const node = $pos.node(i);
              if (node.type.name !== 'doc' && node.isBlock) {
                const blockStart = $pos.start(i);
                const blockEnd = $pos.end(i);
                const blockId = `block-${blockStart}-${blockEnd}`;
                
                // Set selected block
                setSelectedBlock({
                  id: blockId,
                  start: blockStart,
                  end: blockEnd,
                  node: node
                });
                break;
              }
            }
          }
          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

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
        case 'ul':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'ol':
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
        case 'hr':
          editor.chain().focus().setHorizontalRule().run();
          break;
        default:
          break;
      }
    }
  };
  
  const toggleInlineComments = () => {
    setShowInlineComments(!showInlineComments);
  };

  // Handle click outside to close slash menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSlashMenu && !event.target.closest('.slash-menu')) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSlashMenu]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full relative bg-white" ref={editorRef}>
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-2 mb-4">
          <EditorToolbar editor={editor} />
          <button
            onClick={toggleInlineComments}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              showInlineComments 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle inline suggestions"
          >
            {showInlineComments ? '🔍 Hide Suggestions' : '🔍 Show Suggestions'}
          </button>
          <div className="text-xs text-gray-500">
            Press # to add suggestion • Select text to suggest changes
          </div>
        </div>
      )}
      
      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="slash-menu absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[200px]"
          style={{
            left: slashMenuPosition.x,
            top: slashMenuPosition.y,
          }}
        >
          <div className="text-xs text-gray-500 mb-2 px-2">BLOCKS</div>
          <div className="space-y-1">
            <button
              onClick={() => handleSlashCommand('h1')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-lg font-bold text-gray-700">H1</span>
              <span className="text-sm text-gray-600">Large heading</span>
            </button>
            <button
              onClick={() => handleSlashCommand('h2')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-md font-bold text-gray-700">H2</span>
              <span className="text-sm text-gray-600">Medium heading</span>
            </button>
            <button
              onClick={() => handleSlashCommand('h3')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-sm font-bold text-gray-700">H3</span>
              <span className="text-sm text-gray-600">Small heading</span>
            </button>
            <button
              onClick={() => handleSlashCommand('ul')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-700">•</span>
              <span className="text-sm text-gray-600">Bullet list</span>
            </button>
            <button
              onClick={() => handleSlashCommand('ol')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-700">1.</span>
              <span className="text-sm text-gray-600">Numbered list</span>
            </button>
            <button
              onClick={() => handleSlashCommand('task')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-700">☐</span>
              <span className="text-sm text-gray-600">Task list</span>
            </button>
            <button
              onClick={() => handleSlashCommand('code')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-700 font-mono">&lt;/&gt;</span>
              <span className="text-sm text-gray-600">Code block</span>
            </button>
            <button
              onClick={() => handleSlashCommand('quote')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-700">❝</span>
              <span className="text-sm text-gray-600">Quote</span>
            </button>
            <button
              onClick={() => handleSlashCommand('hr')}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <span className="text-gray-700">―</span>
              <span className="text-sm text-gray-600">Divider</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Comment Button */}
      {showCommentButton && selectedText && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{
            left: `${commentButtonPosition.x}px`,
            top: `${commentButtonPosition.y - 40}px`,
          }}
        >
          <div className="flex gap-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <button
              onClick={() => {
                if (onTextSelect) {
                  const { from, to } = editor.state.selection;
                  const $from = editor.state.doc.resolve(from);
                  const $to = editor.state.doc.resolve(to);
                  const isBlockSelection = $from.parent === $to.parent && 
                                         ($from.parentOffset === 0 && $to.parentOffset === $to.parent.content.size);
                  onTextSelect(selectedText, { from, to }, 'comment', isBlockSelection ? 'block' : 'text');
                }
                setShowCommentButton(false);
              }}
              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
            >
              💡 Suggest Change
            </button>
            <button
              onClick={() => setShowCommentButton(false)}
              className="px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Inline Comment Inputs */}
      {Object.entries(commentInputs).map(([commentId, commentData]) => (
        <div
          key={commentId}
          className="absolute z-50 pointer-events-auto"
          style={{
            left: `${commentData.position.x + 20}px`,
            top: `${commentData.position.y}px`,
          }}
        >
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 shadow-lg min-w-[250px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-700 font-semibold text-sm"># Suggestion</span>
              <button
                onClick={() => {
                  setCommentInputs(prev => {
                    const newInputs = { ...prev };
                    delete newInputs[commentId];
                    return newInputs;
                  });
                  setActiveCommentId(null);
                }}
                className="text-blue-600 hover:text-blue-800 ml-auto"
              >
                ✕
              </button>
            </div>
            <textarea
              value={commentData.text}
              onChange={(e) => {
                setCommentInputs(prev => ({
                  ...prev,
                  [commentId]: {
                    ...prev[commentId],
                    text: e.target.value
                  }
                }));
              }}
              placeholder="Type your suggestion..."
              className="w-full p-3 border border-blue-300 rounded text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              rows="4"
              autoFocus
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  if (commentData.text.trim() && onTextSelect) {
                    const selectedText = editor.state.doc.textBetween(commentData.from, commentData.to);
                    onTextSelect(selectedText, { from: commentData.from, to: commentData.to }, 'suggestion', 'text', commentData.text);
                  }
                  setCommentInputs(prev => {
                    const newInputs = { ...prev };
                    delete newInputs[commentId];
                    return newInputs;
                  });
                  setActiveCommentId(null);
                }}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Add Suggestion
              </button>
              <button
                onClick={() => {
                  setCommentInputs(prev => {
                    const newInputs = { ...prev };
                    delete newInputs[commentId];
                    return newInputs;
                  });
                  setActiveCommentId(null);
                }}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {/* Block Comment Button */}
      {showBlockCommentButton && hoveredBlock && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{
            left: `${blockCommentPosition.x}px`,
            top: `${blockCommentPosition.y}px`,
          }}
        >
          <div className="notion-block-actions">
            <button
              onClick={() => {
                if (hoveredBlock) {
                  // Toggle block comments like Notion
                  const blockId = hoveredBlock.id;
                  setBlockComments(prev => ({
                    ...prev,
                    [blockId]: {
                      visible: !prev[blockId]?.visible,
                      comments: prev[blockId]?.comments || [],
                      blockInfo: hoveredBlock
                    }
                  }));
                  
                  setSelectedBlock({
                    id: hoveredBlock.id,
                    start: hoveredBlock.start,
                    end: hoveredBlock.end,
                    node: hoveredBlock.node
                  });
                }
                setShowBlockCommentButton(false);
              }}
              className="notion-block-btn comment-btn"
              title="Add comment to this block (like Notion)"
            >
              💬
            </button>
          </div>
        </div>
      )}
      
      {/* Live Cursor and Mouse Indicators */}
      {Array.isArray(activeUsers) && activeUsers.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          {activeUsers.filter(user => user.userId !== currentUserId).map((user, index) => {
            // Safety checks for user object
            if (!user || !user.userId || !user.userName) {
              return null;
            }
            
            const userColor = `hsl(${(index * 137) % 360}, 70%, 50%)`;
            const cursorCoords = convertPositionToCoords(user.cursorPosition);
            
            return (
              <div key={user.userId}>
                {/* Text Cursor */}
                {cursorCoords && typeof cursorCoords.x === 'number' && typeof cursorCoords.y === 'number' && (
                  <div
                    className="absolute w-0.5 h-5 animate-pulse transition-all duration-200"
                    style={{
                      backgroundColor: userColor,
                      left: `${cursorCoords.x}px`,
                      top: `${cursorCoords.y}px`,
                    }}
                  >
                    <div
                      className="absolute -top-7 left-0 px-2 py-1 text-xs text-white rounded-md shadow-lg whitespace-nowrap z-20 font-medium"
                      style={{
                        backgroundColor: userColor,
                      }}
                    >
                      {user.userName}
                    </div>
                  </div>
                )}
                
                {/* Mouse Pointer */}
                {user.mousePosition && typeof user.mousePosition.x === 'number' && typeof user.mousePosition.y === 'number' && (
                  <div
                    className="absolute transition-all duration-100 ease-out pointer-events-none"
                    style={{
                      left: `${user.mousePosition.x}px`,
                      top: `${user.mousePosition.y}px`,
                      transform: 'translate(-2px, -2px)',
                      zIndex: 1000,
                    }}
                  >
                    <div
                      className="relative w-3 h-3 rounded-full shadow-lg border border-white"
                      style={{
                        backgroundColor: userColor,
                      }}
                    >
                      <div
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white rounded-md shadow-lg whitespace-nowrap font-medium"
                        style={{
                          backgroundColor: userColor,
                        }}
                      >
                        {user.userName}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[500px] w-full focus:outline-none"
        />
        
        {/* Block hover highlight overlay */}
        {hoveredBlock && (
          <div
            className="notion-block-highlight"
            style={{
              left: `${hoveredBlock.coords.left}px`,
              top: `${hoveredBlock.coords.top}px`,
              width: `${Math.max(hoveredBlock.coords.width, 200)}px`,
              height: `${Math.max(hoveredBlock.coords.height, 24)}px`,
            }}
          />
        )}
        
        {/* Block Comments - Notion Style */}
        {Object.entries(blockComments).map(([blockId, blockData]) => {
          if (!blockData.visible || !blockData.blockInfo) return null;
          
          return (
            <div
              key={blockId}
              className="absolute z-50 pointer-events-auto"
              style={{
                left: `${blockData.blockInfo.coords.left + blockData.blockInfo.coords.width + 20}px`,
                top: `${blockData.blockInfo.coords.top}px`,
              }}
            >
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-[280px] max-w-[350px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                    💬 Block Comments
                  </span>
                  <button
                    onClick={() => {
                      setBlockComments(prev => ({
                        ...prev,
                        [blockId]: { ...prev[blockId], visible: false }
                      }));
                    }}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Existing comments */}
                <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                  {blockData.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-700 text-sm">{comment.author}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(comment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm">{comment.text}</p>
                    </div>
                  ))}
                </div>
                
                {/* Add new comment */}
                <div className="border-t pt-3">
                  <textarea
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const text = e.target.value.trim();
                        if (text) {
                          const newComment = {
                            id: Date.now(),
                            author: 'Current User',
                            text: text,
                            timestamp: new Date()
                          };
                          
                          setBlockComments(prev => ({
                            ...prev,
                            [blockId]: {
                              ...prev[blockId],
                              comments: [...(prev[blockId].comments || []), newComment]
                            }
                          }));
                          
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Press Enter to add comment
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Text Suggestions Display - Stored and Visible */}
        {showInlineComments && comments && comments.length > 0 && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {comments.map(comment => {
              if (!comment.selectedRange || !editor) return null;
              
              try {
                const coords = editor.view.coordsAtPos(comment.selectedRange.to);
                const rect = editor.view.dom.getBoundingClientRect();
                
                return (
                  <div
                    key={comment.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${coords.left - rect.left + 20}px`,
                      top: `${coords.top - rect.top}px`,
                    }}
                  >
                    <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 shadow-lg max-w-[300px]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-semibold text-xs">
                            💡 {comment.author}
                          </span>
                          <span className="text-blue-600 text-xs">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                            ✓
                          </button>
                          <button className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-blue-800 mb-2">{comment.text}</p>
                      
                      {comment.selectedText && (
                        <div className="bg-white border border-blue-200 rounded p-2 mb-2 text-xs">
                          <span className="text-gray-600 font-medium">Selected:</span>
                          <div className="text-gray-800 mt-1">
                            "{comment.selectedText.substring(0, 80)}..."
                          </div>
                        </div>
                      )}
                      
                      {comment.type === 'suggestion' && comment.suggestedText && (
                        <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                          <span className="text-green-600 font-medium">Suggested:</span>
                          <div className="text-green-800 mt-1">
                            "{comment.suggestedText.substring(0, 80)}..."
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } catch (error) {
                console.warn('Error rendering inline comment:', error);
                return null;
              }
            })}
          </div>
        )
      </div>
    </div>
  );
};

export default Editor;