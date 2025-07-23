package com.todoapp.service;

import com.todoapp.model.Todo;
import com.todoapp.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class TodoService {

    private final TodoRepository todoRepository;

    @Autowired
    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public Todo createTodo(Todo todo) {
        validateTodo(todo);
        return todoRepository.save(todo);
    }

    public Optional<Todo> getTodoById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Todo ID cannot be null or empty");
        }
        return todoRepository.findById(id);
    }

    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }


    public List<Todo> getTodosByStatus(boolean completed) {
        return todoRepository.findByCompleted(completed);
    }

    public List<Todo> searchTodos(String searchTerm) {
        return todoRepository.searchByTitle(searchTerm);
    }

    public Todo updateTodo(String id, Todo updatedTodo) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Todo ID cannot be null or empty");
        }

        Optional<Todo> existingTodo = todoRepository.findById(id);
        if (existingTodo.isEmpty()) {
            throw new RuntimeException("Todo not found with id: " + id);
        }

        Todo todo = existingTodo.get();
        
        if (updatedTodo.getTitle() != null) {
            todo.setTitle(updatedTodo.getTitle());
        }
        todo.setCompleted(updatedTodo.isCompleted());
        
        validateTodo(todo);
        return todoRepository.update(todo);
    }

    public boolean deleteTodoById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Todo ID cannot be null or empty");
        }

        if (!todoRepository.existsById(id)) {
            throw new RuntimeException("Todo not found with id: " + id);
        }

        return todoRepository.deleteById(id);
    }

    public void deleteAllTodos() {
        todoRepository.deleteAll();
    }

    public Todo toggleTodoStatus(String id) {
        Optional<Todo> todoOptional = getTodoById(id);
        if (todoOptional.isEmpty()) {
            throw new RuntimeException("Todo not found with id: " + id);
        }

        Todo todo = todoOptional.get();
        todo.setCompleted(!todo.isCompleted());
        
        return todoRepository.update(todo);
    }

    public long getTotalTodosCount() {
        return todoRepository.count();
    }

    public long getCompletedTodosCount() {
        return todoRepository.countByCompleted(true);
    }

    public long getPendingTodosCount() {
        return todoRepository.countByCompleted(false);
    }

    private void validateTodo(Todo todo) {
        if (todo == null) {
            throw new IllegalArgumentException("Todo cannot be null");
        }
        
        if (todo.getTitle() == null || todo.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Todo title cannot be null or empty");
        }
        
        if (todo.getTitle().length() > 200) {
            throw new IllegalArgumentException("Todo title cannot exceed 200 characters");
        }
    }
}