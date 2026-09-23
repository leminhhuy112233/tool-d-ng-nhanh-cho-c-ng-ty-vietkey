/**
 * CommandManager — Quản lý Lịch sử Thao tác (Undo / Redo) theo chuẩn Command Pattern
 * Siêu nhẹ (chỉ lưu delta objects JSON, không nhân bản chuỗi Base64 PDF), hỗ trợ Transaction gom nhóm thao tác kéo thả.
 */

export interface Command {
  execute(): void
  undo(): void
  description?: string
}

export class CommandManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxHistory: number
  private inTransaction = false
  private pendingCommands: Command[] = []
  private transactionDescription = ''
  private onChangeListeners: (() => void)[] = []

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory
  }

  public execute(command: Command): void {
    command.execute()

    if (this.inTransaction) {
      this.pendingCommands.push(command)
      return
    }

    this.undoStack.push(command)
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
    // Khi có hành động mới: xóa sạch redo stack
    this.redoStack = []
    this.notify()
  }

  /**
   * Bắt đầu một Transaction (ví dụ: khi bắt đầu mousedown để kéo thả một đối tượng)
   */
  public startTransaction(description = 'Thao tác kéo thả'): void {
    this.inTransaction = true
    this.pendingCommands = []
    this.transactionDescription = description
  }

  /**
   * Hoàn tất Transaction (ví dụ: khi mouseup kết thúc kéo thả)
   * Gom toàn bộ các bước nhỏ thành 1 Command duy nhất trong Undo stack
   */
  public commitTransaction(): void {
    if (!this.inTransaction) return
    this.inTransaction = false

    if (this.pendingCommands.length === 0) return

    const cmds = [...this.pendingCommands]
    const compositeCommand: Command = {
      description: this.transactionDescription,
      execute: () => {
        for (let i = 0; i < cmds.length; i++) {
          cmds[i].execute()
        }
      },
      undo: () => {
        for (let i = cmds.length - 1; i >= 0; i--) {
          cmds[i].undo()
        }
      }
    }

    this.undoStack.push(compositeCommand)
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
    this.redoStack = []
    this.pendingCommands = []
    this.notify()
  }

  public cancelTransaction(): void {
    if (!this.inTransaction) return
    // Hoàn tác các lệnh dở dang trong transaction
    for (let i = this.pendingCommands.length - 1; i >= 0; i--) {
      this.pendingCommands[i].undo()
    }
    this.inTransaction = false
    this.pendingCommands = []
    this.notify()
  }

  public undo(): boolean {
    const cmd = this.undoStack.pop()
    if (!cmd) return false

    cmd.undo()
    this.redoStack.push(cmd)
    this.notify()
    return true
  }

  public redo(): boolean {
    const cmd = this.redoStack.pop()
    if (!cmd) return false

    cmd.execute()
    this.undoStack.push(cmd)
    this.notify()
    return true
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  public hasUndo(): boolean {
    return this.canUndo()
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  public hasRedo(): boolean {
    return this.canRedo()
  }

  public clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.pendingCommands = []
    this.inTransaction = false
    this.notify()
  }

  public subscribe(listener: () => void): () => void {
    this.onChangeListeners.push(listener)
    return () => {
      this.onChangeListeners = this.onChangeListeners.filter((l) => l !== listener)
    }
  }

  private notify(): void {
    for (const listener of this.onChangeListeners) {
      listener()
    }
  }
}
