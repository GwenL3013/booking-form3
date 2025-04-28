import { createContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const TodoContext = createContext();

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch todos from Firebase
  useEffect(() => {
    const fetchTodos = async () => {
      if (!user) {
        console.log('No authenticated user found');
        setTodos([]);
        setIsLoading(false);
        return;
      }

      console.log('Current user:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });

      try {
        setIsLoading(true);
        const todosRef = collection(db, 'todos');
        const q = query(todosRef, where("userId", "==", user.uid));
        console.log('Fetching todos for user:', user.uid);
        
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot size:', querySnapshot.size);

        const todosList = [];
        querySnapshot.forEach((doc) => {
          todosList.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setTodos(todosList);
      } catch (error) {
        console.error("Error fetching todos:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if there's an authenticated user and todos is empty
    if (user && todos.length === 0) {
      fetchTodos();
    }
  }, [user, todos.length]);

  // Add a new todo
  const addTodo = async (todo) => {
    if (!user) {
      console.error("User is not authenticated!");
      return { success: false, error: "User is not authenticated" };
    }
    
    try {
      const newTodo = {
        ...todo,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'todos'), newTodo);
      setTodos([...todos, { id: docRef.id, ...newTodo }]);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding todo:", error);
      return { success: false, error };
    }
  };

  // Update a todo
  const updateTodo = async (id, updatedTodo) => {
    if (!user) {
      console.error("User is not authenticated!");
      return { success: false, error: "User is not authenticated" };
    }

    try {
      const todoRef = doc(db, 'todos', id);
      await updateDoc(todoRef, updatedTodo);
      
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, ...updatedTodo } : todo
      ));
      
      return { success: true };
    } catch (error) {
      console.error("Error updating todo:", error);
      return { success: false, error };
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    if (!user) {
      console.error("User is not authenticated!");
      return { success: false, error: "User is not authenticated" };
    }

    try {
      await deleteDoc(doc(db, 'todos', id));
      setTodos(todos.filter(todo => todo.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting todo:", error);
      return { success: false, error };
    }
  };

  return (
    <TodoContext.Provider value={{ 
      todos, 
      isLoading, 
      addTodo, 
      updateTodo, 
      deleteTodo 
    }}>
      {children}
    </TodoContext.Provider>
  );
};
