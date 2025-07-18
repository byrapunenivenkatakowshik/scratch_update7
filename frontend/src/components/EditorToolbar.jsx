import React from 'react';

const EditorToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, title, children }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-all duration-200 ${
        isActive
          ? 'bg-purple-100 text-purple-700 border border-purple-300 shadow-sm'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-sm'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
  );

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong className="text-sm">B</strong>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <em className="text-sm">I</em>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <span className="text-sm underline">U</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <span className="text-sm line-through">S</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <span className="text-sm bg-yellow-200 text-black px-1 rounded">H</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <span className="text-sm font-bold">H1</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <span className="text-sm font-bold">H2</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <span className="text-sm font-bold">H3</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <span className="text-sm">• List</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <span className="text-sm">1. List</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="Task List"
        >
          <span className="text-sm">☐ Task</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Code and Quote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <span className="text-sm font-mono">&lt;/&gt;</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <span className="text-sm font-mono">{ }</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <span className="text-sm">❝</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Utilities */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          title="Horizontal Rule"
        >
          <span className="text-sm">―</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          title="Undo (Ctrl+Z)"
        >
          <span className="text-sm">↶</span>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          title="Redo (Ctrl+Y)"
        >
          <span className="text-sm">↷</span>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default EditorToolbar;