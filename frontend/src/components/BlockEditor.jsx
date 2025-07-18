import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';

const BlockEditor = ({ content, onUpdate, onCursorMove, onMouseMove, editable = true, activeUsers = [], currentUserId }) => {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
  const [currentBlock, setCurrentBlock] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          if (node.type.name === 'paragraph') {
            return "Type '/' for commands, or start writing...";
          }
          return 'Start typing...';
        },
        showOnlyWhenEditable: true,
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
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
    },
    editorProps: {
      attributes: {
        class: 'block-editor focus:outline-none min-h-[600px] px-16 py-12 max-w-none notion-editor',
        style: 'font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #37352f;',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (event.key === '/') {
            const { selection } = view.state;
            const coords = view.coordsAtPos(selection.from);
            setBlockMenuPosition({ x: coords.left, y: coords.bottom });
            setShowBlockMenu(true);
          } else if (event.key === 'Escape') {
            setShowBlockMenu(false);
          }
          return false;
        },
        mousemove: (view, event) => {
          if (onMouseMove && editable) {
            const rect = view.dom.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
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
        click: (view, event) => {
          // Handle block selection
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (pos) {
            const node = view.state.doc.nodeAt(pos.pos);
            if (node) {
              setSelectedBlock(pos.pos);
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

  const blockCommands = [
    {
      title: 'Text',
      description: 'Just start typing with plain text',
      icon: '📝',
      command: () => {
        editor.chain().focus().setParagraph().run();
      },
    },
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: '#',
      command: () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: '##',
      command: () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: '###',
      command: () => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: '•',
      command: () => {
        editor.chain().focus().toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering',
      icon: '1.',
      command: () => {
        editor.chain().focus().toggleOrderedList().run();
      },
    },
    {
      title: 'To-do List',
      description: 'Track tasks with a to-do list',
      icon: '☐',
      command: () => {
        editor.chain().focus().toggleTaskList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: '❝',
      command: () => {
        editor.chain().focus().toggleBlockquote().run();
      },
    },
    {
      title: 'Code',
      description: 'Capture a code snippet',
      icon: '</> ',
      command: () => {
        editor.chain().focus().toggleCodeBlock().run();
      },
    },
    {
      title: 'Divider',
      description: 'Visually divide blocks',
      icon: '―',
      command: () => {
        editor.chain().focus().setHorizontalRule().run();
      },
    },
    {
      title: 'Table',
      description: 'Add a table',
      icon: '⊞',
      command: () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },
  ];

  const handleBlockCommand = (command) => {
    setShowBlockMenu(false);
    if (editor) {
      // Delete the '/' character
      editor.commands.deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from });
      command();
    }
  };

  const handleClickOutside = (event) => {
    if (showBlockMenu && !event.target.closest('.block-menu')) {
      setShowBlockMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBlockMenu]);

  const convertPositionToCoords = (position) => {
    if (!editor || !position || !editor.view) return null;
    
    try {
      if (typeof position.from !== 'number' || position.from < 0) {
        return null;
      }
      
      const docSize = editor.view.state.doc.content.size;
      if (position.from > docSize) {
        return null;
      }
      
      const coords = editor.view.coordsAtPos(position.from);
      
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

  if (!editor) {
    return null;
  }

  return (
    <div className="block-editor-container relative bg-white">
      {/* Block Command Menu */}
      {showBlockMenu && (
        <div
          className="block-menu absolute bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[320px]"
          style={{
            left: blockMenuPosition.x,
            top: blockMenuPosition.y,
            fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          }}
        >
          <div className="text-xs text-gray-500 mb-2 px-2 font-medium">BASIC BLOCKS</div>
          <div className="space-y-1">
            {blockCommands.map((block, index) => (
              <button
                key={index}
                onClick={() => handleBlockCommand(block.command)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <span className="text-lg w-6 flex justify-center">{block.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{block.title}</div>
                  <div className="text-xs text-gray-500">{block.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Cursor and Mouse Indicators */}
      {Array.isArray(activeUsers) && activeUsers.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
          {activeUsers.filter(user => user.userId !== currentUserId).map((user, index) => {
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
          className="min-h-[600px] w-full focus:outline-none"
        />
      </div>
    </div>
  );
};

export default BlockEditor;