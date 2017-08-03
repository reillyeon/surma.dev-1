import {Node, NodeType} from './node.js';

export class Parser {
  private _input: string;

  constructor(input: string) {
    this._input = input;
  }

  /**
   * `advance` slices off the next n characters and saves the remainder
   */
  private advance(n: number): string {
    const r = this._input.slice(0, n);
    this._input = this._input.slice(n);
    return r;
  }

  /**
   * `parseDocument` is the entry point to the parser. It returns a document
   * node.
   */
  parseDocument(): Node {
    const rootNode = new Node(NodeType.DOCUMENT_NODE);
    this.parseNodes(rootNode);
    return rootNode;
  }

  /**
   * `parseNodes` parses a sequence of nodes and adds them as children to the
   * given parent node.
   */
  private parseNodes(parent: Node) {
    while(this._input.length > 0 && !this._input.startsWith('</')) {
      const node = this.parseNode();
      node.parentNode = parent;
      // Dont store text nodes with only whitespace
      if(node.type === NodeType.TEXT_NODE && node.value.trim().length === 0)
        continue;
      parent.appendChild(node);
    }
  }

  /**
   * `parseNode` parses the next node
   */
  private parseNode(): Node {
    if(this._input[0] === '<') {
      return this.parseElementNode();
    } else {
      return this.parseTextNode();
    }
  }

  /**
   * `parseElementNode` expects the input to start with a tag. It parses
   * everything as children until it finds the corresponding closing tag.
   */
  private parseElementNode(): Node {
    // Consume '<'
    this.advance(1);
    // Parse tag name
    const idx = this._input.indexOf('>');
    if(idx === -1)
      throw new Error('Unclosed tag');
    const node = new Node(NodeType.ELEMENT_NODE, null, this.advance(idx));
    // Consume '>'
    this.advance(1);

    // Parse children
    this.parseNodes(node);

    // Parse closing tag
    const expectedTag = `</${node.name}>`;
    if(!this._input.startsWith(expectedTag))
      throw new Error(`Unmatched <${node.name}> tag`);
    this.advance(expectedTag.length);

    return node;
  }

  private parseTextNode(): Node {
    // Everything until the next `<` has to be text
    let idx = this._input.indexOf('<');
    // If there is no `<`, there’s only text till the end of the document.
    if(idx === -1) {
      idx = this._input.length;
    }
    const node = new Node(NodeType.TEXT_NODE, null, this.advance(idx));
    return node;
  }
}