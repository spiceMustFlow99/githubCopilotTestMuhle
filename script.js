class MuhleGame {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to actual pixel dimensions
        this.canvas.width = 300;
        this.canvas.height = 300;
        
        // 24 positions total
        this.positions = [
            // Outer square (0-7)
            [30, 30], [150, 30], [270, 30],        // 0, 1, 2
            [30, 150], [270, 150],                  // 3, 4
            [30, 270], [150, 270], [270, 270],     // 5, 6, 7
            
            // Middle square (8-15)
            [75, 75], [150, 75], [225, 75],        // 8, 9, 10
            [75, 150], [225, 150],                  // 11, 12
            [75, 225], [150, 225], [225, 225],     // 13, 14, 15
            
            // Inner square (16-23)
            [112, 112], [150, 112], [188, 112],    // 16, 17, 18
            [112, 150], [188, 150],                // 19, 20
            [112, 188], [150, 188], [188, 188]     // 21, 22, 23
        ];

        // Adjacency map - defines which positions are directly adjacent to each other
        this.adjacencyMap = {
            0: [1, 3, 8],
            1: [0, 2, 9],
            2: [1, 4, 10],
            3: [0, 5, 11],
            4: [2, 7, 12],
            5: [3, 6, 13],
            6: [5, 7, 14],
            7: [4, 6, 15],
            8: [0, 9, 11, 16],
            9: [1, 8, 10, 17],
            10: [2, 9, 12, 18],
            11: [3, 8, 13, 19],
            12: [4, 10, 15, 20],
            13: [5, 11, 14, 21],
            14: [6, 13, 15, 22],
            15: [7, 12, 14, 23],
            16: [17, 19, 8],
            17: [16, 18, 9],
            18: [17, 20, 10],
            19: [16, 21, 11],
            20: [18, 23, 12],
            21: [19, 22, 13],
            22: [21, 23, 14],
            23: [20, 22, 15]
        };

        // Corrected lines - each line connects three positions in a row
        this.lines = [
            // Outer square sides
            [0, 1, 2],      // Top
            [2, 4, 7],      // Right
            [7, 6, 5],      // Bottom
            [5, 3, 0],      // Left
            
            // Middle square sides
            [8, 9, 10],     // Top
            [10, 12, 15],   // Right
            [13, 14, 15],   // Bottom
            [8, 11, 13],    // Left
            
            // Inner square sides
            [16, 17, 18],   // Top
            [18, 20, 23],   // Right
            [21, 22, 23],   // Bottom
            [16, 19, 21],   // Left
            
            // Vertical and horizontal connections between squares
            [0, 8, 16],     // Top-left vertical
            [1, 9, 17],     // Top vertical
            [2, 10, 18],    // Top-right vertical
            [5, 13, 21],    // Bottom-left vertical
            [6, 14, 22],    // Bottom vertical
            [4, 12, 20],    // Right vertical
            [3, 11, 19],    // Left vertical
            [7, 15, 23]     // Bottom-right diagonal
        ];

        this.initializeBoard();
        this.resetGame();
    }

    initializeBoard() {
        // Create a fresh board array with all nulls
        this.board = [];
        for (let i = 0; i < 24; i++) {
            this.board[i] = null;
        }
    }

    resetGame() {
        this.initializeBoard();
        this.currentPlayer = 'white';
        this.piecesPlaced = { white: 0, black: 0 };
        this.gamePhase = 'placing';
        this.selectedPiece = null;
        this.history = [];
        this.gameOver = false;

        document.getElementById('winnerOverlay').style.display = 'none';
        document.getElementById('undoBtn').disabled = true;

        this.render();
        this.updateStatus();
    }

    getAdjacent(pos) {
        // Return directly adjacent positions from the adjacency map
        return this.adjacencyMap[pos] || [];
    }

    canPlayerFly() {
        // Check if the current player has exactly 3 pieces
        const playerPieces = this.board.filter(p => p === this.currentPlayer).length;
        return playerPieces === 3;
    }

    getValidMoves(pos) {
        // If player can fly (has 3 pieces), they can move to any empty position
        if (this.canPlayerFly()) {
            return this.board
                .map((piece, index) => piece === null ? index : null)
                .filter(index => index !== null);
        }
        
        // Otherwise, only adjacent positions
        return this.getAdjacent(pos);
    }

    checkMill(pos) {
        const player = this.board[pos];
        for (let line of this.lines) {
            if (line.includes(pos)) {
                if (line.every(p => this.board[p] === player)) {
                    return true;
                }
            }
        }
        return false;
    }

    getOpponentPieces() {
        const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
        const unprotected = [];
        const protected_ = [];

        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === opponent) {
                if (this.checkMill(i)) {
                    protected_.push(i);
                } else {
                    unprotected.push(i);
                }
            }
        }

        return unprotected.length > 0 ? unprotected : protected_;
    }

    placePiece(pos) {
        if (this.gameOver) return;
        if (this.board[pos] !== null) {
            alert('Position already occupied!');
            return;
        }

        // Save state before making changes
        const stateCopy = {
            board: [...this.board],
            piecesPlaced: { ...this.piecesPlaced },
            selectedPiece: this.selectedPiece
        };
        this.history.push(JSON.stringify(stateCopy));
        document.getElementById('undoBtn').disabled = false;

        this.board[pos] = this.currentPlayer;
        this.piecesPlaced[this.currentPlayer]++;

        if (this.checkMill(pos)) {
            const opponent = this.getOpponentPieces();
            if (opponent.length > 0) {
                const removedPos = prompt(`Mill formed! Remove opponent's piece (positions: ${opponent.join(', ')})`);
                if (removedPos !== null && opponent.includes(parseInt(removedPos))) {
                    this.board[parseInt(removedPos)] = null;
                }
            }
        }

        if (this.piecesPlaced.white === 9 && this.piecesPlaced.black === 9) {
            this.gamePhase = 'moving';
        }

        this.switchPlayer();
        this.checkWinCondition();
        this.render();
    }

    selectPiece(pos) {
        if (this.gameOver) return;
        if (this.gamePhase !== 'moving') return;

        if (this.board[pos] === this.currentPlayer) {
            this.selectedPiece = this.selectedPiece === pos ? null : pos;
            this.render();
        } else if (this.board[pos] === null && this.selectedPiece !== null) {
            // Try to move to an empty position
            this.movePiece(pos);
        }
    }

    movePiece(pos) {
        if (this.selectedPiece === null) return;
        if (this.board[pos] !== null) {
            alert('Position already occupied!');
            return;
        }

        const validMoves = this.getValidMoves(this.selectedPiece);
        if (!validMoves.includes(pos)) {
            const moveType = this.canPlayerFly() ? 'fly to any empty position' : 'move to adjacent positions';
            alert(`Can ${moveType}! Valid moves: ${validMoves.join(', ')}`);
            this.selectedPiece = null;
            this.render();
            return;
        }

        // Save state before making changes
        const stateCopy = {
            board: [...this.board],
            piecesPlaced: { ...this.piecesPlaced },
            selectedPiece: this.selectedPiece
        };
        this.history.push(JSON.stringify(stateCopy));
        document.getElementById('undoBtn').disabled = false;

        this.board[pos] = this.currentPlayer;
        this.board[this.selectedPiece] = null;
        this.selectedPiece = null;

        if (this.checkMill(pos)) {
            const opponent = this.getOpponentPieces();
            if (opponent.length > 0) {
                const removedPos = prompt(`Mill formed! Remove opponent's piece (positions: ${opponent.join(', ')})`);
                if (removedPos !== null && opponent.includes(parseInt(removedPos))) {
                    this.board[parseInt(removedPos)] = null;
                }
            }
        }

        this.switchPlayer();
        this.checkWinCondition();
        this.render();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }

    checkWinCondition() {
        // Only check win conditions during the moving phase, not placement phase
        if (this.gamePhase !== 'moving') return;

        const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
        const opponentPieces = this.board.filter(p => p === opponent).length;

        // Check if opponent has fewer than 3 pieces
        if (opponentPieces < 3) {
            this.endGame(`${this.currentPlayer === 'white' ? 'Black' : 'White'} Wins! (Opponent has fewer than 3 pieces)`);
            return;
        }

        // Check if opponent can move
        let canMove = false;
        
        // If opponent has 3 pieces, they can always move (can fly to any empty space)
        if (opponentPieces === 3) {
            const emptyPositions = this.board.filter(p => p === null).length;
            canMove = emptyPositions > 0;
        } else {
            // Otherwise check if they have adjacent empty positions
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === opponent) {
                    const adjacent = this.getAdjacent(i);
                    if (adjacent.some(p => this.board[p] === null)) {
                        canMove = true;
                        break;
                    }
                }
            }
        }

        if (!canMove) {
            this.endGame(`${this.currentPlayer === 'white' ? 'Black' : 'White'} Wins! (Opponent is blocked)`);
        }
    }

    endGame(message) {
        this.gameOver = true;
        document.getElementById('winnerMessage').textContent = message;
        document.getElementById('winnerOverlay').style.display = 'flex';
    }

    undo() {
        if (this.history.length === 0) return;

        const state = JSON.parse(this.history.pop());
        this.board = [...state.board];
        this.piecesPlaced = { ...state.piecesPlaced };
        this.selectedPiece = state.selectedPiece;
        this.gameOver = false;

        if (this.history.length === 0) {
            document.getElementById('undoBtn').disabled = true;
        }

        this.switchPlayer();
        this.render();
    }

    updateStatus() {
        const phase = this.gamePhase === 'placing' 
            ? `Placing Phase (${this.piecesPlaced[this.currentPlayer]}/9 pieces placed)`
            : 'Moving Phase';
        
        let selectedInfo = '';
        if (this.gamePhase === 'moving' && this.selectedPiece !== null) {
            const validMoves = this.getValidMoves(this.selectedPiece);
            const moveType = this.canPlayerFly() ? '(Flying - can move anywhere!)' : '';
            selectedInfo = `<br>Selected piece at ${this.selectedPiece}. Can move to: ${validMoves.join(', ')} ${moveType}`;
        }
        
        document.getElementById('gameStatus').innerHTML = 
            `<strong>${this.currentPlayer.toUpperCase()}'s Turn</strong><br>${phase}${selectedInfo}`;
        
        const playerPieces = this.board.filter(p => p === this.currentPlayer).length;
        const opponentColor = this.currentPlayer === 'white' ? 'black' : 'white';
        const opponentPieces = this.board.filter(p => p === opponentColor).length;
        
        document.getElementById('whiteCount').textContent = this.board.filter(p => p === 'white').length;
        document.getElementById('blackCount').textContent = this.board.filter(p => p === 'black').length;
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw lines
        this.ctx.strokeStyle = '#8b7355';
        this.ctx.lineWidth = 2;
        
        for (let line of this.lines) {
            const [p1, p2, p3] = line;
            const [x1, y1] = this.positions[p1];
            const [x2, y2] = this.positions[p2];
            const [x3, y3] = this.positions[p3];

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x3, y3);
            this.ctx.stroke();
        }

        // Draw positions
        for (let i = 0; i < this.positions.length; i++) {
            const [x, y] = this.positions[i];
            
            // Position marker
            this.ctx.fillStyle = '#d4a574';
            this.ctx.strokeStyle = '#8b7355';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Draw piece if present
            if (this.board[i] !== null) {
                this.ctx.fillStyle = this.board[i] === 'white' ? '#f0f0f0' : '#333';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 12, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // Highlight selected piece
                if (this.selectedPiece === i) {
                    this.ctx.strokeStyle = '#667eea';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 14, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }

        this.updateStatus();
    }

    getClickPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Find nearest position
        let nearest = -1;
        let minDist = 20;
        
        for (let i = 0; i < this.positions.length; i++) {
            const [px, py] = this.positions[i];
            const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        }

        return nearest;
    }
}

const game = new MuhleGame();

// Add click handler
document.getElementById('board').addEventListener('click', (event) => {
    const pos = game.getClickPosition(event);
    if (pos === -1) return;

    if (game.gamePhase === 'placing') {
        game.placePiece(pos);
    } else {
        game.selectPiece(pos);
    }
});