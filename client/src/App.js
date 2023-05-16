import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
    const [socket, setSocket] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [clientId, setClientId] = useState(null); // Dodany nowy stan przechowujący identyfikator klienta

    useEffect(() => {
        const socket = io('http://localhost:8000');
        setSocket(socket);

        socket.on('connect', () => {
            setClientId(socket.id); // Po podłączeniu klienta otrzymujemy identyfikator i zapisujemy go w stanie clientId
        });

        socket.on('updateData', (data) => {
            updateTasks(data.tasks);
        });

        socket.on('addTask', (task) => {
            if (!isTaskExists(task.id)) {
                addTask(task);
            }
        });

        socket.on('removeTask', (taskId) => {
            removeTask(taskId, false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const updateTasks = (newTasks) => {
        setTasks(newTasks);
    };

    const removeTask = (taskId, emitEvent = true) => {
        setTasks((tasks) => tasks.filter((task) => task.id !== taskId));

        if (emitEvent) {
            socket.emit('removeTask', taskId);
        }
    };

    const submitForm = (event) => {
        event.preventDefault();
        const newTask = {
            id: uuidv4(),
            taskName: taskName,
            clientId: clientId, // Dodajemy identyfikator klienta do nowego zadania
        };
        addTask(newTask);
        socket.emit('addTask', newTask);
        setTaskName('');
    };

    const addTask = (task) => {
        if (!isTaskExists(task.id)) {
            // Sprawdzamy, czy zadanie nie zostało już dodane przez bieżącego użytkownika
            if (task.clientId !== clientId) {
                setTasks((tasks) => [...tasks, task]);
            }
        }
    };

    const handleInputChange = (event) => {
        setTaskName(event.target.value);
    };

    const isTaskExists = (taskId) => {
        return tasks.some((task) => task.id === taskId);
    };

    return (
        <div className="App">
            <header>
                <h1>ToDoList.app</h1>
            </header>

            <section className="tasks-section" id="tasks-section">
                <h2>Tasks</h2>

                <ul className="tasks-section__list" id="tasks-list">
                    {tasks.map((task) => (
                        <li key={task.id} className="task">
                            {task.taskName}
                            <button
                                className="btn btn--red"
                                onClick={() => removeTask(task.id)}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>

                <form id="add-task-form" onSubmit={submitForm}>
                    <input
                        className="text-input"
                        autoComplete="off"
                        type="text"
                        placeholder="Type your description"
                        id="task-name"
                        value={taskName}
                        onChange={handleInputChange}
                    />
                    <button className="btn" type="submit">
                        Add
                    </button>
                </form>
            </section>
        </div>
    );
};

export default App;
