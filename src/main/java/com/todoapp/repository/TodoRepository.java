package com.todoapp.repository;

import com.todoapp.model.Todo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class TodoRepository {

    private final DynamoDbTable<Todo> todoTable;

    @Autowired
    public TodoRepository(DynamoDbTable<Todo> todoTable) {
        this.todoTable = todoTable;
    }

    public Todo save(Todo todo) {
        if (todo.getId() == null || todo.getId().isEmpty()) {
            todo.setId(UUID.randomUUID().toString());
        }
        todoTable.putItem(todo);
        return todo;
    }

    public Optional<Todo> findById(String id) {
        Todo todo = todoTable.getItem(Key.builder().partitionValue(id).build());
        return Optional.ofNullable(todo);
    }

    public List<Todo> findAll() {
        return todoTable.scan(ScanEnhancedRequest.builder().build())
                .items()
                .stream()
                .collect(Collectors.toList());
    }


    public List<Todo> findByCompleted(boolean completed) {
        return todoTable.scan()
                .items()
                .stream()
                .filter(todo -> todo.isCompleted() == completed)
                .collect(Collectors.toList());
    }

    public List<Todo> searchByTitle(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return findAll();
        }
        
        return todoTable.scan()
                .items()
                .stream()
                .filter(todo -> todo.getTitle() != null && 
                               todo.getTitle().toLowerCase().contains(searchTerm.toLowerCase()))
                .collect(Collectors.toList());
    }


    public Todo update(Todo todo) {
        todo.updateTimestamp();
        todoTable.putItem(todo);
        return todo;
    }

    public boolean deleteById(String id) {
        try {
            Key key = Key.builder().partitionValue(id).build();
            Todo deletedTodo = todoTable.deleteItem(key);
            return deletedTodo != null;
        } catch (Exception e) {
            return false;
        }
    }

    public void deleteAll() {
        List<Todo> allTodos = findAll();
        allTodos.forEach(todo -> deleteById(todo.getId()));
    }

    public long count() {
        return findAll().size();
    }

    public long countByCompleted(boolean completed) {
        return findByCompleted(completed).size();
    }

    public boolean existsById(String id) {
        return findById(id).isPresent();
    }
}