import { useEffect, useState, useContext } from "react";
import { Button, Card } from "react-bootstrap";
import { TodoContext } from "../../context/TodoContext";
import "../todo/TodoCard.css";

export default function TodoCard({ todo, onEdit }) {
    const completed = todo.completed;
    const border = completed ? "success" : "danger";


    const [timer, setTimer] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const setTodos = useContext(TodoContext).setTodos;

    //Functions related to timer
    const startTimer = () => {
        if (timerInterval === null) {
            const intervalID = setInterval(() => {
                setTimer((prevTimer) => prevTimer + 1);
            }, 1000);
            setTimerInterval(intervalID);
        }
    }

    const pauseTimer = () => {
        clearInterval(timerInterval);
        setTimerInterval(null);
    }

    const resetTimer = () => {
        clearInterval(timerInterval);
        setTimerInterval(null);
        setTimer(0);

    }

    const deleteTodo = () => {
        const isConfirmed = window.confirm("Are you sure you want to delete this Todo?")

        if (isConfirmed) {
            setTodos((prevTodos) =>
                prevTodos.filter((prevTodo) => prevTodo.id !== todo.id)
            );
        } else {
            window.confirm("Deletion cancelled.");
        }
    };

    useEffect(() => {
        return () => {
            clearInterval(timerInterval);
        };
    }, [timerInterval])

    const cardBackgroundColor = completed ? '#630ed1d5' : '#f68914d5';


    return (
        <>
            <Card border={border} className="todo_card" style={{ backgroundColor: cardBackgroundColor }}>

                <Card.Header>{!completed && "Not"} Completed</Card.Header>

                <Card.Body>
                    <Card.Title className="todo_title">{todo.title}</Card.Title>
                    <Card.Text className="todo_text">{todo.description}</Card.Text>
                    <p>Timer: {timer} seconds</p>
                    <Button onClick={startTimer}>
                        <i className="bi bi-play"></i>
                    </Button>
                    <Button onClick={pauseTimer} className="mx-2">
                        <i className="bi bi-pause-fill"></i>
                    </Button>
                    <Button onClick={resetTimer} className="mx-2">
                        <i className="bi bi-arrow-clockwise"></i>
                    </Button>
                    <Button variant="secondary" onClick={onEdit} className="mx-2">
                        <i className="bi bi-pencil"></i>
                    </Button>

                    <Button variant="danger" onClick={deleteTodo} className="mx-2">
                        <i className="bi bi-trash3"></i>
                    </Button>



                </Card.Body>
            </Card >
        </>
    );
}