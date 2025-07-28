class SimpleTodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTodos();
    }

    bindEvents() {
        // Add todo form
        document.getElementById('add-todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Search
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.filterAndRender();
        });

        document.getElementById('clear-search').addEventListener('click', () => {
            searchInput.value = '';
            this.currentSearch = '';
            this.filterAndRender();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    async makeRequest(url, options = {}) {
        try {
            console.log(`Making request to: /api/todos${url}`, options);
            const response = await fetch(`/api/todos${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log(`Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            if (response.status === 204) return null; // No content
            const result = await response.json();
            console.log('Response data:', result);
            return result;
        } catch (error) {
            console.error('Request failed:', error);
            alert(`Error: ${error.message}. Check console for details.`);
            throw error;
        }
    }

    async loadTodos() {
        try {
            this.todos = await this.makeRequest('') || [];
            this.filterAndRender();
        } catch (error) {
            console.error('Failed to load todos:', error);
        }
    }

    async addTodo() {
        const input = document.getElementById('todo-input');
        const title = input.value.trim();

        if (!title) return;

        try {
            const newTodo = await this.makeRequest('', {
                method: 'POST',
                body: JSON.stringify({ title, completed: false })
            });

            this.todos.unshift(newTodo);
            input.value = '';
            this.filterAndRender();
        } catch (error) {
            console.error('Failed to add todo:', error);
        }
    }

    async toggleTodo(id) {
        try {
            const updatedTodo = await this.makeRequest(`/${id}/toggle`, {
                method: 'PATCH'
            });

            const index = this.todos.findIndex(todo => todo.id === id);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.filterAndRender();
            }
        } catch (error) {
            console.error('Failed to toggle todo:', error);
        }
    }

    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            await this.makeRequest(`/${id}`, { method: 'DELETE' });
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.filterAndRender();
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    }

    startEdit(id) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const todoText = todoItem.querySelector('.todo-text');
        const currentText = todoText.textContent;

        todoItem.classList.add('editing');
        todoItem.innerHTML = `
            <div class="todo-checkbox ${this.todos.find(t => t.id === id).completed ? 'completed' : ''}">
                ${this.todos.find(t => t.id === id).completed ? '✓' : ''}
            </div>
            <input type="text" class="edit-input" value="${currentText}" maxlength="200">
            <div class="edit-actions">
                <button class="todo-btn save-btn" onclick="app.saveEdit('${id}')">Save</button>
                <button class="todo-btn cancel-btn" onclick="app.cancelEdit('${id}')">Cancel</button>
            </div>
        `;

        const input = todoItem.querySelector('.edit-input');
        input.focus();
        input.select();

        // Save on Enter, Cancel on Escape
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit(id);
            if (e.key === 'Escape') this.cancelEdit(id);
        });
    }

    async saveEdit(id) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const input = todoItem.querySelector('.edit-input');
        const newTitle = input.value.trim();

        if (!newTitle) {
            alert('Todo title cannot be empty');
            return;
        }

        try {
            const todo = this.todos.find(t => t.id === id);
            const updatedTodo = await this.makeRequest(`/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: newTitle, completed: todo.completed })
            });

            const index = this.todos.findIndex(t => t.id === id);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.filterAndRender();
            }
        } catch (error) {
            console.error('Failed to update todo:', error);
        }
    }

    cancelEdit(id) {
        this.filterAndRender();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.filterAndRender();
    }

    filterTodos() {
        let filtered = this.todos;

        // Filter by status
        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        } else if (this.currentFilter === 'pending') {
            filtered = filtered.filter(todo => !todo.completed);
        }

        // Filter by search
        if (this.currentSearch) {
            filtered = filtered.filter(todo =>
                todo.title.toLowerCase().includes(this.currentSearch.toLowerCase())
            );
        }

        return filtered;
    }

    filterAndRender() {
        const filteredTodos = this.filterTodos();
        this.renderTodos(filteredTodos);
        this.updateStats();
    }

    renderTodos(todos) {
        const todoList = document.getElementById('todo-list');
        const emptyState = document.getElementById('empty-state');

        if (todos.length === 0) {
            todoList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        todoList.innerHTML = todos.map(todo => this.createTodoElement(todo)).join('');

        // Bind events
        todoList.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const id = e.target.closest('.todo-item').dataset.id;
                this.toggleTodo(id);
            });
        });

        todoList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.todo-item').dataset.id;
                this.startEdit(id);
            });
        });

        todoList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.todo-item').dataset.id;
                this.deleteTodo(id);
            });
        });
    }

    createTodoElement(todo) {
        const createdAt = new Date(todo.createdAt).toLocaleDateString();
        const updatedAt = new Date(todo.updatedAt).toLocaleDateString();
        const timeInfo = createdAt === updatedAt ? `Created: ${createdAt}` : `Created: ${createdAt} • Updated: ${updatedAt}`;

        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}">
                    ${todo.completed ? '✓' : ''}
                </div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.title)}</div>
                    <div class="todo-timestamp">${timeInfo}</div>
                </div>
                <div class="todo-actions">
                    <button class="todo-btn edit-btn">Edit</button>
                    <button class="todo-btn delete-btn">Delete</button>
                </div>
            </li>
        `;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        let statsText = '';
        if (this.currentFilter === 'all') {
            if (total === 0) {
                statsText = 'No items';
            } else {
                statsText = `${total} item${total !== 1 ? 's' : ''} • ${pending} active`;
            }
        } else if (this.currentFilter === 'pending') {
            statsText = `${pending} active item${pending !== 1 ? 's' : ''}`;
        } else {
            statsText = `${completed} completed item${completed !== 1 ? 's' : ''}`;
        }

        if (this.currentSearch) {
            const filtered = this.filterTodos().length;
            statsText += ` • ${filtered} found`;
        }

        document.getElementById('todo-stats').textContent = statsText;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new SimpleTodoApp();
