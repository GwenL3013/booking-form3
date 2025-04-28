import { useContext, useState } from 'react';
import { Col, Container, Row, Button, Modal } from 'react-bootstrap';
import TodoCard from "./TodoCard";
import { TodoContext } from "../../context/TodoContext";
import AddTodo from "./AddTodo";
import EditTodo from "./EditTodo";
import { FaEdit } from 'react-icons/fa';
import CountDown from "./CountDown";

export default function TodoList() {
  const { todos } = useContext(TodoContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState(null);

  const handleEditTodo = (todoId) => {
    setSelectedTodoId(todoId);
    setShowEditModal(true);
  };

  return (
    <Container className='todo-list'>
      {/* Header with title and countdown */}
      <div className="d-flex align-items-center mb-4">
      <div className="ms-auto">
        <CountDown />
      </div>
    </div>
      
     
      
      {/* Todo Cards */}
      <Row>
        {todos.length > 0 ? (
          <CardGroup todos={todos} onEditTodo={handleEditTodo} />
        ) : (
          <Col>
            <p className="text-center">No todos yet. Add your first todo!</p>
          </Col>
        )}
      </Row>

      {/* Add Todo Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Todo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddTodo show={showAddModal} onHide={() => setShowAddModal(false)} />
        </Modal.Body>
      </Modal>

      {/* Edit Todo Modal */}
      <EditTodo 
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        todoId={selectedTodoId}
      />
    </Container>
  );
}

// Update CardGroup to pass the edit handler
function CardGroup({ todos, onEditTodo }) {
  return todos.map((todo) => (
    <Col md={4} className="mb-4" key={todo.id}>
      <TodoCard todo={todo} onEdit={() => onEditTodo(todo.id)} />
    </Col>
  ));
}