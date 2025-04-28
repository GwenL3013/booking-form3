import { useContext, useState, useEffect } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { TodoContext } from "../../context/TodoContext";
import './AddTodo.css'

export default function EditTodo({ show, onHide, todoId }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [completed, setCompleted] = useState(false);
    const { todos, updateTodo } = useContext(TodoContext);

    useEffect(() => {
        if (todoId) {
            const todo = todos.find(t => t.id === todoId);
            if (todo) {
                setTitle(todo.title);
                setDescription(todo.description);
                setCompleted(todo.completed);
            }
        }
    }, [todoId, todos]);

    async function handleEditTodo(event) {
        event.preventDefault();
        if (!todoId) return;
        
        const updatedTodo = { title, description, completed };
        await updateTodo(todoId, updatedTodo);
        if (onHide) onHide();
    }

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header className="editTodoHeader">
                <Modal.Title>Edit Todo</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleEditTodo}>
                <Modal.Body className="editTodoBody">
                    <Form.Group className="mb-3" controlId="title">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            type="text"
                            placeholder="Edit Task"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            as="textarea"
                            rows={3}
                            placeholder={`1. \n2. \n3. `}
                        />
                    </Form.Group>
                    <Form.Check
                        type="checkbox"
                        id="completed"
                        label="Mark as completed"
                        checked={completed}
                        onChange={(event) => setCompleted(event.target.checked)}
                        className="mb-3"
                    />
                    <Button variant="primary" type="submit">
                        Save Changes
                    </Button>
                </Modal.Body>
            </Form>
        </Modal>
    );
}