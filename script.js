document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task');
    const taskTitleInput = document.getElementById('task-title');
    const taskDateInput = document.getElementById('task-date');
    const taskPrioritySelect = document.getElementById('task-priority');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // État de l'application
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let dragItem = null;
    
    // Initialisation
    renderTasks();
    setupEventListeners();
    startReminderCheck();
    
    function setupEventListeners() {
        // Ajout de tâche
        addTaskBtn.addEventListener('click', addTask);
        taskTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        
        // Filtres
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
        
        // Drag & drop
        taskList.addEventListener('dragstart', handleDragStart);
        taskList.addEventListener('dragover', handleDragOver);
        taskList.addEventListener('drop', handleDrop);
        taskList.addEventListener('dragend', handleDragEnd);
    }
    
    function addTask() {
        const title = taskTitleInput.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now(),
            title,
            completed: false,
            priority: taskPrioritySelect.value,
            dueDate: taskDateInput.value,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        
        // Réinitialiser le formulaire
        taskTitleInput.value = '';
        taskDateInput.value = '';
        taskPrioritySelect.value = 'medium';
        taskTitleInput.focus();
    }
    
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
    
    function toggleTaskCompletion(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li class="empty-state">Aucune tâche trouvée</li>';
            return;
        }
        
        taskList.innerHTML = '';
        
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = 'task-item';
            taskElement.draggable = true;
            taskElement.dataset.id = task.id;
            
            const isDue = task.dueDate && new Date(task.dueDate) < new Date();
            
            taskElement.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <span class="priority-indicator priority-${task.priority}"></span>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="task-details">
                        ${task.dueDate ? `
                            <div class="${isDue && !task.completed ? 'reminder-active' : ''}">
                                <i>⏰</i> ${formatDate(task.dueDate)}
                            </div>
                        ` : ''}
                        <div>
                            <i>📅</i> ${formatDate(task.createdAt, true)}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn delete-btn">🗑️</button>
                </div>
            `;
            
            taskList.appendChild(taskElement);
            
            // Événements pour les éléments dynamiques
            taskElement.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTaskCompletion(task.id));
            taskElement.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        });
    }
    
    function formatDate(dateString, short = false) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return short ? 
            date.toLocaleDateString() : 
            `${date.toLocaleDateString()} ${date.toLocaleTimeString().slice(0, 5)}`;
    }
    
    function startReminderCheck() {
        setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (task.dueDate && !task.completed) {
                    const dueDate = new Date(task.dueDate);
                    if (dueDate < now) {
                        renderTasks();
                    }
                }
            });
        }, 60000); // Vérifie toutes les minutes
    }
    
    // Fonctions Drag & Drop
    function handleDragStart(e) {
        dragItem = e.target.closest('.task-item');
        setTimeout(() => dragItem.classList.add('dragging'), 0);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        const draggableElements = [...taskList.querySelectorAll('.task-item:not(.dragging)')];
        const nextElement = getDragNextElement(draggableElements, e.clientY);
        
        draggableElements.forEach(el => el.classList.remove('drag-over'));
        if (nextElement) nextElement.classList.add('drag-over');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        const nextElement = taskList.querySelector('.drag-over');
        
        if (dragItem && nextElement) {
            const dragIndex = tasks.findIndex(t => t.id === parseInt(dragItem.dataset.id));
            const nextIndex = tasks.findIndex(t => t.id === parseInt(nextElement.dataset.id));
            
            if (dragIndex > -1 && nextIndex > -1) {
                const [movedTask] = tasks.splice(dragIndex, 1);
                tasks.splice(nextIndex, 0, movedTask);
                saveTasks();
        }
    }
    
    taskList.querySelectorAll('.task-item').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function handleDragEnd() {
    if (dragItem) dragItem.classList.remove('dragging');
    dragItem = null;
}

function getDragNextElement(elements, y) {
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
        });