import { useContext, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { TodoContext } from "../../context/TodoContext";
import './AddTodo.css'

export default function AddTodo({ show, onHide }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [completed, setCompleted] = useState(false);
    const { addTodo } = useContext(TodoContext);

    async function handleAddTodo(event) {
        event.preventDefault();
        const newTodo = { title, description, completed };
        await addTodo(newTodo);
        if (onHide) onHide();
        setTitle("");
        setDescription("");
        setCompleted(false);
    }

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header className="addTodoHeader">
                <Modal.Title>Add Todo</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleAddTodo}>
                <Modal.Body className="addTodoBody">
                    <Form.Group className="mb-3" controlId="title">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            type="text"
                            placeholder="Add Task"
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
                        Submit
                    </Button>
                </Modal.Body>
            </Form>
        </Modal>
    );
}