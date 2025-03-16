import {useQuery, useMutation, useQueryClient} from 'react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const API_URL = 'https://jsonplaceholder.typicode.com/todos';

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  isSynced?: boolean; // Indicates if the task is synced with the server
}

export const useTodos = () => {
  const queryClient = useQueryClient();
  /**
   * Fetch todos from API if online; otherwise, use local storage.
   */
  const fetchTodos = async (): Promise<Todo[]> => {
    const localTodos = await AsyncStorage.getItem('todos');
    const parsedTodos: Todo[] = localTodos ? JSON.parse(localTodos) : [];

    const deletedTaskIds = await AsyncStorage.getItem('deletedTaskIds');
    const parsedDeletedTaskIds: number[] = deletedTaskIds
      ? JSON.parse(deletedTaskIds)
      : [];

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      const response = await fetch(API_URL);
      const serverTodos: Todo[] = await response.json();

      // Mark all server todos as synced and filter out deleted tasks
      const serverTodosWithSync = serverTodos
        .map(todo => ({...todo, isSynced: true}))
        .filter(todo => !parsedDeletedTaskIds.includes(todo.id)); // Remove deleted tasks

      const filteredServerTodos = serverTodosWithSync.filter(
        serverTodo =>
          !parsedTodos.some(localTodo => localTodo.id === serverTodo.id),
      );

      // Merge local todos with server todos (avoiding duplicates)
      const mergedTodos = [...parsedTodos, ...filteredServerTodos];

      await AsyncStorage.setItem('todos', JSON.stringify(mergedTodos));
      return mergedTodos;
    }
    return parsedTodos;
  };

  const {data: todos, isLoading} = useQuery<Todo[]>('todos', fetchTodos);

  /**
   * Save a new todo locally (offline-first).
   */
  const addTodo = useMutation(async (newTodo: Todo) => {
    const localTodos = await AsyncStorage.getItem('todos');
    const parsedTodos: Todo[] = localTodos ? JSON.parse(localTodos) : [];

    const updatedTodos = [
      {...newTodo, isSynced: false}, // Mark as not synced
      ...parsedTodos,
    ];
    await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
    queryClient.invalidateQueries('todos');
  });

  /**
   * Update an existing todo (edits or toggle completion).
   */ const updateTodo = useMutation(async (updatedTodo: Todo) => {
    const localTodos = await AsyncStorage.getItem('todos');
    const parsedTodos: Todo[] = localTodos ? JSON.parse(localTodos) : [];

    const updatedTodos = parsedTodos.map(todo =>
      todo.id === updatedTodo.id
        ? {...todo, ...updatedTodo, isSynced: false}
        : todo,
    );

    await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
    queryClient.invalidateQueries('todos');
  });

  /**
   * Delete a todo and track deleted IDs to prevent re-sync.
   */
  const deleteTodo = useMutation(async (id: number) => {
    const localTodos = await AsyncStorage.getItem('todos');
    const parsedTodos: Todo[] = localTodos ? JSON.parse(localTodos) : [];
    // Remove the task and save locally
    const updatedTodos = parsedTodos.filter(todo => todo.id !== id);
    await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));

    // Store deleted ID to prevent re-sync from server
    const deletedTaskIds = await AsyncStorage.getItem('deletedTaskIds');
    const parsedDeletedTaskIds: number[] = deletedTaskIds
      ? JSON.parse(deletedTaskIds)
      : [];

    const updatedDeletedTaskIds = [...parsedDeletedTaskIds, id];
    await AsyncStorage.setItem(
      'deletedTaskIds',
      JSON.stringify(updatedDeletedTaskIds),
    );

    queryClient.invalidateQueries('todos');
  });

  /**
   * Toggle a task's completion status.
   */
  const toggleComplete = (todo: Todo) => {
    updateTodo.mutate({...todo, completed: !todo.completed});
  };

  return {
    todos,
    isLoading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
  };
};
