import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import 'blockly/blocks';

// Define custom blocks
Blockly.Blocks['tello_takeoff'] = {
  init: function () {
    this.appendDummyInput().appendField('Takeoff');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('Take off automatically');
  },
};

javascriptGenerator.forBlock['tello_takeoff'] = function () {
  return 'await tello.takeoff();\n';
};

pythonGenerator.forBlock['tello_takeoff'] = function () {
  return 'tello.takeoff()\n';
};

Blockly.Blocks['tello_land'] = {
  init: function () {
    this.appendDummyInput().appendField('Land');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('Land automatically');
  },
};

javascriptGenerator.forBlock['tello_land'] = function () {
  return 'await tello.land();\n';
};

pythonGenerator.forBlock['tello_land'] = function () {
  return 'tello.land()\n';
};

Blockly.Blocks['tello_move'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Move')
      .appendField(new Blockly.FieldDropdown([
        ['Forward', 'forward'],
        ['Back', 'back'],
        ['Left', 'left'],
        ['Right', 'right'],
        ['Up', 'up'],
        ['Down', 'down'],
      ]), 'DIRECTION')
      .appendField(new Blockly.FieldNumber(100, 20, 500), 'DISTANCE')
      .appendField('cm');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Move the drone in a direction');
  },
};

javascriptGenerator.forBlock['tello_move'] = function (block: any) {
  const direction = block.getFieldValue('DIRECTION');
  const distance = block.getFieldValue('DISTANCE');
  return `await tello.${direction}(${distance});\n`;
};

pythonGenerator.forBlock['tello_move'] = function (block: any) {
  const direction = block.getFieldValue('DIRECTION');
  const distance = block.getFieldValue('DISTANCE');
  return `tello.move_${direction}(${distance})\n`;
};

Blockly.Blocks['tello_rotate'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Rotate')
      .appendField(new Blockly.FieldDropdown([
        ['Clockwise', 'cw'],
        ['Counter-Clockwise', 'ccw'],
      ]), 'DIRECTION')
      .appendField(new Blockly.FieldNumber(90, 1, 360), 'DEGREE')
      .appendField('degrees');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Rotate the drone');
  },
};

javascriptGenerator.forBlock['tello_rotate'] = function (block: any) {
  const direction = block.getFieldValue('DIRECTION');
  const degree = block.getFieldValue('DEGREE');
  return `await tello.rotate('${direction}', ${degree});\n`;
};

pythonGenerator.forBlock['tello_rotate'] = function (block: any) {
  const direction = block.getFieldValue('DIRECTION');
  const degree = block.getFieldValue('DEGREE');
  const method = direction === 'cw' ? 'rotate_clockwise' : 'rotate_counter_clockwise';
  return `tello.${method}(${degree})\n`;
};

Blockly.Blocks['tello_flip'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Flip')
      .appendField(new Blockly.FieldDropdown([
        ['Forward', 'f'],
        ['Back', 'b'],
        ['Left', 'l'],
        ['Right', 'r'],
      ]), 'DIRECTION');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip('Flip the drone');
  },
};

javascriptGenerator.forBlock['tello_flip'] = function (block: any) {
  const direction = block.getFieldValue('DIRECTION');
  return `await tello.flip('${direction}');\n`;
};

pythonGenerator.forBlock['tello_flip'] = function (block: any) {
  const direction = block.getFieldValue('DIRECTION');
  return `tello.flip('${direction}')\n`;
};

interface BlocklyEditorProps {
  onCodeChange: (code: string) => void;
  onPythonCodeChange?: (code: string) => void;
  initialPythonCode?: string;
}

export const BlocklyEditor: React.FC<BlocklyEditorProps> = ({ onCodeChange, onPythonCodeChange, initialPythonCode }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null);
  const isInternalChange = useRef(false);

  // Function to parse Python code and create blocks
  const loadBlocksFromPython = (code: string, ws: Blockly.WorkspaceSvg) => {
    ws.clear();
    const lines = code.split('\n');
    let previousBlock: Blockly.Block | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        let blockType = '';
        let fields: Record<string, any> = {};

        if (trimmed.includes('takeoff()')) {
            blockType = 'tello_takeoff';
        } else if (trimmed.includes('land()')) {
            blockType = 'tello_land';
        } else if (trimmed.includes('move_')) {
            blockType = 'tello_move';
            // tello.move_forward(100)
            const match = trimmed.match(/move_(\w+)\((\d+)\)/);
            if (match) {
                fields['DIRECTION'] = match[1]; // forward, back, etc.
                fields['DISTANCE'] = parseInt(match[2]);
            }
        } else if (trimmed.includes('rotate_')) {
            blockType = 'tello_rotate';
            // tello.rotate_clockwise(90)
            const match = trimmed.match(/rotate_(clockwise|counter_clockwise)\((\d+)\)/);
            if (match) {
                fields['DIRECTION'] = match[1] === 'clockwise' ? 'cw' : 'ccw';
                fields['DEGREE'] = parseInt(match[2]);
            }
        } else if (trimmed.includes('flip')) {
             blockType = 'tello_flip';
             const match = trimmed.match(/flip\(['"](\w+)['"]\)/);
             if (match) {
                 fields['DIRECTION'] = match[1];
             }
        }

        if (blockType) {
            const block = ws.newBlock(blockType);
            for (const [key, value] of Object.entries(fields)) {
                block.setFieldValue(value, key);
            }
            block.initSvg();
            block.render();

            if (previousBlock) {
                (previousBlock as any).nextConnection?.connect(block.previousConnection);
            }
            previousBlock = block;
        }
    }
    ws.scrollCenter();
  };

  useEffect(() => {
    if (!blocklyDiv.current) return;

    workspace.current = Blockly.inject(blocklyDiv.current, {
      toolbox: {
        kind: 'categoryToolbox',
        contents: [
          {
            kind: 'category',
            name: 'Flight',
            colour: '230',
            contents: [
              { kind: 'block', type: 'tello_takeoff' },
              { kind: 'block', type: 'tello_land' },
            ],
          },
          {
            kind: 'category',
            name: 'Movement',
            colour: '160',
            contents: [
              { kind: 'block', type: 'tello_move' },
              { kind: 'block', type: 'tello_rotate' },
              { kind: 'block', type: 'tello_flip' },
            ],
          },
          {
            kind: 'category',
            name: 'Logic',
            colour: '210',
            contents: [
              { kind: 'block', type: 'controls_repeat_ext' },
              { kind: 'block', type: 'math_number' },
            ],
          },
        ],
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
    });

    // Load initial code if provided
    if (initialPythonCode) {
        loadBlocksFromPython(initialPythonCode, workspace.current);
    }

    const updateCode = () => {
      if (!workspace.current) return;
      
      // Prevent loops if we were to support bidirectional live sync, 
      // but here we just emit changes.
      isInternalChange.current = true;
      
      const jsCode = javascriptGenerator.workspaceToCode(workspace.current);
      onCodeChange(jsCode);

      if (onPythonCodeChange) {
          const pyCode = pythonGenerator.workspaceToCode(workspace.current);
          onPythonCodeChange(pyCode);
      }
      
      isInternalChange.current = false;
    };

    workspace.current.addChangeListener(updateCode);

    return () => {
      workspace.current?.dispose();
    };
  }, [onCodeChange, onPythonCodeChange]); // Remove initialPythonCode from deps to avoid reload

  return <div ref={blocklyDiv} className="w-full h-full" />;
};
