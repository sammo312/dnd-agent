export type InputEvent =
  | { type: 'char'; char: string }
  | { type: 'submit'; line: string }
  | { type: 'backspace' }
  | { type: 'history-prev'; line: string }
  | { type: 'history-next'; line: string }
  | { type: 'tab' }
  | { type: 'interrupt' }
  | null;

export class InputHandler {
  private buffer: string = '';
  private cursor: number = 0;
  private history: string[] = [];
  private historyIndex: number = -1;
  private tempBuffer: string = '';

  processKey(data: string): InputEvent {
    if (data === '\x1b[A') {
      if (this.history.length === 0) return null;
      if (this.historyIndex === -1) {
        this.tempBuffer = this.buffer;
        this.historyIndex = this.history.length - 1;
      } else if (this.historyIndex > 0) {
        this.historyIndex--;
      }
      this.buffer = this.history[this.historyIndex];
      this.cursor = this.buffer.length;
      return { type: 'history-prev', line: this.buffer };
    }

    if (data === '\x1b[B') {
      if (this.historyIndex === -1) return null;
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.buffer = this.history[this.historyIndex];
      } else {
        this.historyIndex = -1;
        this.buffer = this.tempBuffer;
      }
      this.cursor = this.buffer.length;
      return { type: 'history-next', line: this.buffer };
    }

    if (data === '\x03') {
      this.buffer = '';
      this.cursor = 0;
      return { type: 'interrupt' };
    }

    if (data === '\t') {
      return { type: 'tab' };
    }

    if (data === '\r' || data === '\n') {
      const line = this.buffer.trim();
      if (line.length > 0) {
        this.history.push(line);
        if (this.history.length > 100) this.history.shift();
      }
      this.buffer = '';
      this.cursor = 0;
      this.historyIndex = -1;
      this.tempBuffer = '';
      return { type: 'submit', line };
    }

    if (data === '\x7f' || data === '\b') {
      if (this.cursor > 0) {
        this.buffer = this.buffer.slice(0, this.cursor - 1) + this.buffer.slice(this.cursor);
        this.cursor--;
        return { type: 'backspace' };
      }
      return null;
    }

    if (data.length === 1 && data >= ' ') {
      this.buffer = this.buffer.slice(0, this.cursor) + data + this.buffer.slice(this.cursor);
      this.cursor++;
      return { type: 'char', char: data };
    }

    return null;
  }

  getBuffer(): string {
    return this.buffer;
  }

  getCursor(): number {
    return this.cursor;
  }

  clear(): void {
    this.buffer = '';
    this.cursor = 0;
  }
}
