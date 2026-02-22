import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import 'blockly/blocks';

// Define custom blocks
Blockly.Blocks['python_raw'] = {
  init: function() {
    const FieldMultiline = (Blockly as any).FieldMultilineInput || Blockly.FieldTextInput;
    this.appendDummyInput()
        .appendField("Python")
        .appendField(new FieldMultiline("code"), "CODE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
    this.setTooltip("Código Python personalizado");
  }
};

javascriptGenerator.forBlock['python_raw'] = function(block: any) {
  return '// Código Python nativo (não executável em modo Blocos)\n';
};

pythonGenerator.forBlock['python_raw'] = function(block: any) {
  const code = block.getFieldValue('CODE');
  return code + '\n';
};

Blockly.Blocks['tello_takeoff'] = {
  init: function () {
    this.appendDummyInput().appendField('Descolar');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('Descolar automaticamente');
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
    this.appendDummyInput().appendField('Aterrar');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('Aterrar automaticamente');
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
      .appendField('Mover')
      .appendField(new Blockly.FieldDropdown([
        ['Frente', 'forward'],
        ['Trás', 'back'],
        ['Esquerda', 'left'],
        ['Direita', 'right'],
        ['Cima', 'up'],
        ['Baixo', 'down'],
      ]), 'DIRECTION')
      .appendField(new Blockly.FieldNumber(100, 20, 500), 'DISTANCE')
      .appendField('cm');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Mover o drone numa direção');
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
      .appendField('Rodar')
      .appendField(new Blockly.FieldDropdown([
        ['Sentido Horário', 'cw'],
        ['Sentido Anti-Horário', 'ccw'],
      ]), 'DIRECTION')
      .appendField(new Blockly.FieldNumber(90, 1, 360), 'DEGREE')
      .appendField('graus');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Rodar o drone');
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
      .appendField('Acrobacia')
      .appendField(new Blockly.FieldDropdown([
        ['Frente', 'f'],
        ['Trás', 'b'],
        ['Esquerda', 'l'],
        ['Direita', 'r'],
      ]), 'DIRECTION');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip('Fazer uma acrobacia');
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

Blockly.Blocks['tello_set_speed'] = {
  init: function () {
    this.appendValueInput('SPEED')
        .setCheck('Number')
        .appendField('Definir Velocidade');
    this.appendDummyInput().appendField('cm/s');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Definir velocidade de voo (10-100)');
  },
};

javascriptGenerator.forBlock['tello_set_speed'] = function (block: any) {
  const speed = javascriptGenerator.valueToCode(block, 'SPEED', 0) || '10';
  return `await tello.set_speed(${speed});\n`;
};

pythonGenerator.forBlock['tello_set_speed'] = function (block: any) {
  const speed = pythonGenerator.valueToCode(block, 'SPEED', 0) || '10';
  return `tello.set_speed(${speed})\n`;
};

Blockly.Blocks['tello_get_battery'] = {
  init: function () {
    this.appendDummyInput().appendField('Obter Bateria (%)');
    this.setOutput(true, 'Number');
    this.setColour(210);
    this.setTooltip('Obter nível de bateria atual');
  },
};

javascriptGenerator.forBlock['tello_get_battery'] = function () {
  return ['tello.get_battery()', 0];
};

pythonGenerator.forBlock['tello_get_battery'] = function () {
  return ['tello.get_battery()', 0];
};

Blockly.Blocks['tello_get_height'] = {
  init: function () {
    this.appendDummyInput().appendField('Obter Altura (cm)');
    this.setOutput(true, 'Number');
    this.setColour(210);
    this.setTooltip('Obter altura atual');
  },
};

javascriptGenerator.forBlock['tello_get_height'] = function () {
  return ['tello.get_height()', 0];
};

pythonGenerator.forBlock['tello_get_height'] = function () {
  return ['tello.get_height()', 0];
};

Blockly.Blocks['tello_go_xyz_speed'] = {
  init: function () {
    this.appendDummyInput().appendField('Ir para Posição');
    this.appendValueInput('X').setCheck('Number').appendField('x:');
    this.appendValueInput('Y').setCheck('Number').appendField('y:');
    this.appendValueInput('Z').setCheck('Number').appendField('z:');
    this.appendValueInput('SPEED').setCheck('Number').appendField('vel:');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip('Voar para coordenadas (x, y, z) à velocidade definida');
  },
};

javascriptGenerator.forBlock['tello_go_xyz_speed'] = function (block: any) {
  const x = javascriptGenerator.valueToCode(block, 'X', 0) || '0';
  const y = javascriptGenerator.valueToCode(block, 'Y', 0) || '0';
  const z = javascriptGenerator.valueToCode(block, 'Z', 0) || '0';
  const speed = javascriptGenerator.valueToCode(block, 'SPEED', 0) || '10';
  return `await tello.go_xyz_speed(${x}, ${y}, ${z}, ${speed});\n`;
};

pythonGenerator.forBlock['tello_go_xyz_speed'] = function (block: any) {
  const x = pythonGenerator.valueToCode(block, 'X', 0) || '0';
  const y = pythonGenerator.valueToCode(block, 'Y', 0) || '0';
  const z = pythonGenerator.valueToCode(block, 'Z', 0) || '0';
  const speed = pythonGenerator.valueToCode(block, 'SPEED', 0) || '10';
  return `tello.go_xyz_speed(${x}, ${y}, ${z}, ${speed})\n`;
};

Blockly.Blocks['tello_emergency'] = {
  init: function () {
    this.appendDummyInput().appendField('EMERGÊNCIA');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
    this.setTooltip('Parar motores imediatamente');
  },
};

javascriptGenerator.forBlock['tello_emergency'] = function () {
  return 'await tello.emergency();\n';
};

pythonGenerator.forBlock['tello_emergency'] = function () {
  return 'tello.emergency()\n';
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
  const isParsing = useRef(false);

  // Function to parse Python code and create blocks
  const loadBlocksFromPython = (code: string, ws: Blockly.WorkspaceSvg) => {
    isParsing.current = true;
    try {
        ws.clear();
        // Sanitize code: replace non-breaking spaces with regular spaces
        const sanitizedCode = code.replace(/\u00A0/g, ' ');
        const lines = sanitizedCode.split('\n');
        let previousBlock: Blockly.Block | null = null;
        let unknownLines: string[] = [];
        let captureIndent: number | null = null;

        const createBlock = (type: string, fields: Record<string, any> = {}) => {
            const block = ws.newBlock(type);
            for (const [key, value] of Object.entries(fields)) {
                block.setFieldValue(value, key);
            }
            block.initSvg();
            block.render();

            if (previousBlock) {
                (previousBlock as any).nextConnection?.connect(block.previousConnection);
            }
            previousBlock = block;
        };

        const flushUnknown = () => {
            if (unknownLines.length > 0) {
                // Filter out empty lines from the end
                while (unknownLines.length > 0 && !unknownLines[unknownLines.length - 1].trim()) {
                    unknownLines.pop();
                }
                if (unknownLines.length > 0) {
                    createBlock('python_raw', { 'CODE': unknownLines.join('\n') });
                }
                unknownLines = [];
            }
        };

        const getIndent = (str: string) => {
            let spaces = 0;
            for (const char of str) {
                if (char === ' ') spaces++;
                else if (char === '\t') spaces += 4; // Assume 4 spaces for tab
                else break;
            }
            return spaces;
        };

        for (const line of lines) {
            // Preserve empty lines if we are capturing, but don't let them break capture logic
            if (!line.trim()) {
                if (unknownLines.length > 0) unknownLines.push(line);
                continue;
            }

            const trimmed = line.trim();
            const currentIndent = getIndent(line);
            
            // Skip setup code to avoid duplication (only at top level)
            if (captureIndent === null && (
                trimmed.startsWith('from djitellopy') || 
                trimmed.startsWith('import time') || 
                trimmed === 'tello = Tello()' || 
                trimmed === 'tello.connect()')) {
                continue;
            }

            // Check if we are in capture mode (inside a control structure)
            if (captureIndent !== null) {
                if (currentIndent > captureIndent) {
                    // Still inside the block
                    unknownLines.push(line);
                    continue;
                } else {
                    // Indentation returned to level. Check for continuation keywords.
                    if (trimmed.startsWith('else:') || 
                        trimmed.startsWith('elif ') || 
                        trimmed.startsWith('except') || 
                        trimmed.startsWith('finally:')) {
                        unknownLines.push(line);
                        continue;
                    }
                    // End of captured block
                    captureIndent = null;
                    // Fall through to process this line as a new start
                }
            }

            // Normal processing
            let blockType = '';
            let fields: Record<string, any> = {};

            // Only recognize commands if we are NOT in a captured block (captureIndent is null)
            // (We already handled the continue case above)

            if (trimmed.includes('takeoff()')) {
                blockType = 'tello_takeoff';
            } else if (trimmed.includes('land()')) {
                blockType = 'tello_land';
            } else if (trimmed.includes('move_')) {
                blockType = 'tello_move';
                const match = trimmed.match(/move_(\w+)\((\d+)\)/);
                if (match) {
                    fields['DIRECTION'] = match[1];
                    fields['DISTANCE'] = parseInt(match[2]);
                }
            } else if (trimmed.includes('rotate_')) {
                blockType = 'tello_rotate';
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
            } else if (trimmed.includes('set_speed')) {
                 blockType = 'tello_set_speed';
                 const match = trimmed.match(/set_speed\((\d+)\)/);
                 if (match) {
                     // Value inputs are harder to set directly via fields
                 }
            } else if (trimmed.includes('emergency')) {
                 blockType = 'tello_emergency';
            } else if (trimmed.includes('go_xyz_speed')) {
                 blockType = 'tello_go_xyz_speed';
                 const match = trimmed.match(/go_xyz_speed\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
                 if (match) {
                     // Complex input
                 }
            }

            if (blockType) {
                flushUnknown();
                createBlock(blockType, fields);
            } else {
                // Unknown line. Add to unknownLines.
                unknownLines.push(line);
                // Check if this line starts a control structure
                if (trimmed.endsWith(':')) {
                    captureIndent = currentIndent;
                }
            }
        }
        flushUnknown();
        ws.scrollCenter();
    } finally {
        isParsing.current = false;
    }
  };

  useEffect(() => {
    if (!blocklyDiv.current) return;

    workspace.current = Blockly.inject(blocklyDiv.current, {
      toolbox: {
        kind: 'categoryToolbox',
        contents: [
          {
            kind: 'category',
            name: 'Voo',
            colour: '230',
            contents: [
              { kind: 'block', type: 'tello_takeoff' },
              { kind: 'block', type: 'tello_land' },
              { kind: 'block', type: 'tello_emergency' },
              { kind: 'block', type: 'tello_set_speed' },
            ],
          },
          {
            kind: 'category',
            name: 'Movimento',
            colour: '160',
            contents: [
              { kind: 'block', type: 'tello_move' },
              { kind: 'block', type: 'tello_rotate' },
              { kind: 'block', type: 'tello_flip' },
              { kind: 'block', type: 'tello_go_xyz_speed' },
            ],
          },
          {
            kind: 'category',
            name: 'Dados',
            colour: '210',
            contents: [
              { kind: 'block', type: 'tello_get_battery' },
              { kind: 'block', type: 'tello_get_height' },
            ],
          },
          {
            kind: 'category',
            name: 'Lógica',
            colour: '210',
            contents: [
              { kind: 'block', type: 'controls_repeat_ext' },
              { kind: 'block', type: 'math_number' },
            ],
          },
          {
            kind: 'category',
            name: 'Avançado',
            colour: '60',
            contents: [
              { kind: 'block', type: 'python_raw' },
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

    const updateCode = (event: any) => {
      if (!workspace.current) return;
      if (isParsing.current) return;
      
      // Filter events to avoid unnecessary updates
      if (
          event.type !== Blockly.Events.BLOCK_CHANGE &&
          event.type !== Blockly.Events.BLOCK_CREATE &&
          event.type !== Blockly.Events.BLOCK_DELETE &&
          event.type !== Blockly.Events.BLOCK_MOVE &&
          event.type !== Blockly.Events.VAR_CREATE &&
          event.type !== Blockly.Events.VAR_DELETE &&
          event.type !== Blockly.Events.VAR_RENAME
      ) {
          return;
      }
      
      // Prevent loops if we were to support bidirectional live sync, 
      // but here we just emit changes.
      isInternalChange.current = true;
      
      const jsCode = javascriptGenerator.workspaceToCode(workspace.current);
      onCodeChange(jsCode);

      if (onPythonCodeChange) {
          const pyCode = pythonGenerator.workspaceToCode(workspace.current);
          
          // Only prepend setup if not already present
          let finalCode = pyCode;
          if (!pyCode.includes('from djitellopy import Tello')) {
              const setupCode = `from djitellopy import Tello
import time

tello = Tello()
tello.connect()

`;
              finalCode = setupCode + pyCode;
          }
          
          onPythonCodeChange(finalCode);
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
