import React from 'react';
import Editor from '@monaco-editor/react';

interface PythonEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export const PythonEditor: React.FC<PythonEditorProps> = ({ code, onChange }) => {
  return (
    <Editor
      height="100%"
      defaultLanguage="python"
      value={code}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
};
