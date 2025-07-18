import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';

const SimpleEditor = ({ content = '', onUpdate, editable = true }) => {
  const [isReady, setIsReady] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onUpdate) {
        onUpdate(html);
      }
    },
    onCreate: () => {
      console.log('✅ Simple editor created successfully');
      setIsReady(true);
    },
    onDestroy: () => {
      console.log('🔄 Simple editor destroyed');
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!isReady) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        color: '#666'
      }}>
        <div>Loading editor...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '400px', 
      border: '1px solid #ddd', 
      borderRadius: '4px',
      padding: '10px',
      backgroundColor: '#fff'
    }}>
      <EditorContent 
        editor={editor} 
        style={{ 
          minHeight: '380px',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default SimpleEditor;