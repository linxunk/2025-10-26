// 扫雷游戏主类
class MinesweeperGame {
    constructor() {
        // 游戏配置
        this.configs = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };
        
        // 游戏状态
        this.gameState = {
            isGameStarted: false,
            isGameOver: false,
            isGameWon: false,
            timeElapsed: 0,
            flagsUsed: 0,
            cellsRevealed: 0,
            totalSafeCells: 0
        };
        
        // 游戏数据
        this.board = [];
        this.difficulty = 'beginner';
        this.timerInterval = null;
        
        // DOM元素
        this.gameBoard = document.getElementById('game-board');
        this.mineCounter = document.getElementById('mine-counter');
        this.timer = document.getElementById('timer');
        this.resetBtn = document.getElementById('reset-btn');
        this.resetEmoji = document.getElementById('reset-emoji');
        this.gameStatus = document.getElementById('game-status');
        this.difficultySelect = document.getElementById('difficulty');
        
        this.init();
    }
    
    // 初始化游戏
    init() {
        this.setupEventListeners();
        this.startNewGame();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 难度选择
        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.startNewGame();
        });
        
        // 重新开始按钮
        this.resetBtn.addEventListener('click', () => {
            this.startNewGame();
        });
        
        // 禁用右键菜单
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    // 开始新游戏
    startNewGame() {
        // 清除计时器
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // 重置游戏状态
        this.gameState = {
            isGameStarted: false,
            isGameOver: false,
            isGameWon: false,
            timeElapsed: 0,
            flagsUsed: 0,
            cellsRevealed: 0,
            totalSafeCells: 0
        };
        
        // 获取游戏配置
        const config = this.configs[this.difficulty];
        
        // 创建游戏板
        this.createBoard(config.rows, config.cols);
        
        // 更新UI
        this.updateUI();
        this.updateMineCounter();
        this.updateTimer();
        
        // 重置按钮表情
        this.resetEmoji.textContent = '🙂';
        this.gameStatus.textContent = '点击任意格子开始游戏';
        this.gameStatus.className = 'game-status';
    }
    
    // 创建游戏板
    createBoard(rows, cols) {
        this.board = [];
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        for (let row = 0; row < rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < cols; col++) {
                const cell = {
                    row: row,
                    col: col,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    element: null
                };
                
                this.board[row][col] = cell;
                
                // 创建DOM元素
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                
                // 添加事件监听器
                cellElement.addEventListener('click', this.handleCellClick.bind(this));
                cellElement.addEventListener('contextmenu', this.handleCellRightClick.bind(this));
                
                cell.element = cellElement;
                this.gameBoard.appendChild(cellElement);
            }
        }
    }
    
    // 布置地雷
    placeMines(excludeRow, excludeCol) {
        const config = this.configs[this.difficulty];
        const rows = config.rows;
        const cols = config.cols;
        const mineCount = config.mines;
        
        let minesPlaced = 0;
        const totalCells = rows * cols;
        this.gameState.totalSafeCells = totalCells - mineCount;
        
        // 创建可用位置列表（排除第一次点击位置及其周围）
        const availablePositions = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // 排除第一次点击的位置及其周围
                const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
                if (!isExcluded) {
                    availablePositions.push({ row, col });
                }
            }
        }
        
        // 随机打乱可用位置
        for (let i = availablePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
        }
        
        // 放置地雷
        for (let i = 0; i < mineCount && i < availablePositions.length; i++) {
            const { row, col } = availablePositions[i];
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        // 计算每个格子周围的地雷数量
        this.calculateAdjacentMines();
    }
    
    // 计算相邻地雷数量
    calculateAdjacentMines() {
        const config = this.configs[this.difficulty];
        const rows = config.rows;
        const cols = config.cols;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].adjacentMines = this.countAdjacentMines(row, col);
                }
            }
        }
    }
    
    // 计算指定位置周围的地雷数量
    countAdjacentMines(row, col) {
        const config = this.configs[this.difficulty];
        const rows = config.rows;
        const cols = config.cols;
        let count = 0;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    if (this.board[newRow][newCol].isMine) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    // 处理格子点击（左键）
    handleCellClick(event) {
        if (this.gameState.isGameOver) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        // 第一次点击时开始游戏
        if (!this.gameState.isGameStarted) {
            this.startGame(row, col);
        }
        
        this.revealCell(row, col);
    }
    
    // 处理格子右键点击（标记）
    handleCellRightClick(event) {
        if (this.gameState.isGameOver) return;
        
        event.preventDefault();
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.isRevealed) return;
        
        this.toggleFlag(row, col);
    }
    
    // 开始游戏
    startGame(firstRow, firstCol) {
        this.gameState.isGameStarted = true;
        this.placeMines(firstRow, firstCol);
        this.startTimer();
        this.gameStatus.textContent = '游戏进行中...';
    }
    
    // 开始计时器
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.gameState.timeElapsed++;
            this.updateTimer();
        }, 1000);
    }
    
    // 翻开格子
    revealCell(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed || cell.isFlagged) return;
        
        cell.isRevealed = true;
        this.gameState.cellsRevealed++;
        
        // 更新DOM
        this.updateCellDisplay(cell);
        
        // 如果是地雷，游戏结束
        if (cell.isMine) {
            this.gameOver(false);
            return;
        }
        
        // 如果是空白格子，递归翻开周围格子
        if (cell.adjacentMines === 0) {
            this.revealAdjacentCells(row, col);
        }
        
        // 检查胜利条件
        this.checkWinCondition();
    }
    
    // 递归翻开相邻格子
    revealAdjacentCells(row, col) {
        const config = this.configs[this.difficulty];
        const rows = config.rows;
        const cols = config.cols;
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }
    
    // 切换标记
    toggleFlag(row, col) {
        const cell = this.board[row][col];
        
        if (cell.isRevealed) return;
        
        cell.isFlagged = !cell.isFlagged;
        
        if (cell.isFlagged) {
            this.gameState.flagsUsed++;
        } else {
            this.gameState.flagsUsed--;
        }
        
        this.updateCellDisplay(cell);
        this.updateMineCounter();
        
        // 检查胜利条件
        this.checkWinCondition();
    }
    
    // 更新格子显示
    updateCellDisplay(cell) {
        const element = cell.element;
        
        // 清除所有类
        element.className = 'cell';
        
        if (cell.isRevealed) {
            element.classList.add('revealed');
            
            if (cell.isMine) {
                element.classList.add('mine');
                element.textContent = '💣';
            } else if (cell.adjacentMines > 0) {
                element.classList.add(`number-${cell.adjacentMines}`);
                element.textContent = cell.adjacentMines;
            } else {
                element.textContent = '';
            }
        } else if (cell.isFlagged) {
            element.classList.add('flagged');
            element.textContent = '🚩';
        } else {
            element.textContent = '';
        }
    }
    
    // 检查胜利条件
    checkWinCondition() {
        // 只有在游戏已经开始且未结束时才检查胜利条件
        if (!this.gameState.isGameStarted || this.gameState.isGameOver) return;
        
        // 条件1：翻开所有安全格子
        if (this.gameState.cellsRevealed >= this.gameState.totalSafeCells) {
            this.gameOver(true);
            return;
        }
        
        // 条件2：标记所有地雷格子
        const config = this.configs[this.difficulty];
        const rows = config.rows;
        const cols = config.cols;
        let allMinesFlagged = true;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = this.board[row][col];
                if (cell.isMine && !cell.isFlagged) {
                    allMinesFlagged = false;
                    break;
                }
            }
            if (!allMinesFlagged) break;
        }
        
        if (allMinesFlagged) {
            this.gameOver(true);
        }
    }
    
    // 游戏结束
    gameOver(won) {
        this.gameState.isGameOver = true;
        this.gameState.isGameWon = won;
        
        // 停止计时器
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // 显示所有地雷
        this.revealAllMines();
        
        // 更新UI
        if (won) {
            this.resetEmoji.textContent = '😎';
            this.gameStatus.textContent = '恭喜你，胜利了！';
            this.gameStatus.className = 'game-status victory';
        } else {
            this.resetEmoji.textContent = '😵';
            this.gameStatus.textContent = '游戏失败，再试一次！';
            this.gameStatus.className = 'game-status defeat';
        }
    }
    
    // 显示所有地雷
    revealAllMines() {
        const config = this.configs[this.difficulty];
        const rows = config.rows;
        const cols = config.cols;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = this.board[row][col];
                if (cell.isMine && !cell.isRevealed) {
                    cell.isRevealed = true;
                    this.updateCellDisplay(cell);
                }
            }
        }
    }
    
    // 更新地雷计数器
    updateMineCounter() {
        const config = this.configs[this.difficulty];
        const totalMines = config.mines;
        const remainingMines = totalMines - this.gameState.flagsUsed;
        this.mineCounter.textContent = remainingMines.toString().padStart(3, '0');
    }
    
    // 更新计时器
    updateTimer() {
        const minutes = Math.floor(this.gameState.timeElapsed / 60);
        const seconds = this.gameState.timeElapsed % 60;
        this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 更新UI
    updateUI() {
        // 这里可以添加其他UI更新逻辑
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});

// 键盘快捷键支持
document.addEventListener('keydown', (event) => {
    // 按R键重新开始游戏
    if (event.key.toLowerCase() === 'r') {
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.click();
    }
    
    // 按1、2、3键切换难度
    if (event.key === '1') {
        document.getElementById('difficulty').value = 'beginner';
        document.getElementById('difficulty').dispatchEvent(new Event('change'));
    } else if (event.key === '2') {
        document.getElementById('difficulty').value = 'intermediate';
        document.getElementById('difficulty').dispatchEvent(new Event('change'));
    } else if (event.key === '3') {
        document.getElementById('difficulty').value = 'expert';
        document.getElementById('difficulty').dispatchEvent(new Event('change'));
    }
});