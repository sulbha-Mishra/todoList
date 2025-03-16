/**
 * AllTasks Component - Displays a list of tasks with filtering, syncing, and CRUD operations.
 *
 * Features:
 * - Add, edit, and delete tasks
 * - Mark tasks as completed or pending
 * - Sync tasks with the server when online
 * - Offline support using AsyncStorage
 * - Filter tasks by status (all, pending, completed)
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import {useTodos, Todo} from '../hooks/useTodos';
import NetInfo from '@react-native-community/netinfo';
import {useQueryClient} from 'react-query';
import SyncIndicator from '../utils/helper/SyncIndicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {widthRatio} from '../utils/helper/dimensions';
import colors from '../theme/colors';

const filterArr = ['All', 'Pending', 'Completed'];
const AllTasks: React.FC = () => {
  const {todos, isLoading, addTodo, updateTodo, deleteTodo, toggleComplete} =
    useTodos();
  const [modalState, setModalState] = useState({
    addTask: false,
    confirmSync: false,
  });
  const [taskData, setTaskData] = useState<{
    id: number | null;
    title: string;
    description: string;
    completed: boolean;
  }>({id: null, title: '', description: '', completed: false});
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const queryClient = useQueryClient();

  /**
   * Effect to check network status and trigger sync when online.
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected) {
        setIsOnline(true);
        setIsSyncing(true);
        await queryClient.invalidateQueries('todos');
        setIsSyncing(false);
      } else {
        setIsOnline(false);
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  /**
   * Handles adding or updating a task.
   */
  const handleAddOrEditTask = () => {
    if (taskData.title.trim()) {
      taskData.id
        ? updateTodo.mutate({
            id: taskData.id,
            title: taskData.title,
            description: taskData.description || '',
            completed: taskData.completed,
          })
        : addTodo.mutate({
            id: Date.now(),
            title: taskData.title,
            description: taskData.description || '',
            completed: false,
          });
      resetModal();
    }
  };

  /**
   * Opens the edit modal with pre-filled task data.
   * @param {Todo} task - The task to edit.
   */
  const openEditModal = (task: Todo) => {
    setTaskData({
      id: task.id,
      title: task.title,
      description: task.description || '',
      completed: task.completed,
    });
    setModalState({...modalState, addTask: true});
  };

  /**
   * Resets the modal state and task data.
   */
  const resetModal = () => {
    setTaskData({id: null, title: '', description: '', completed: false});
    setModalState({
      addTask: false,
      confirmSync: false,
    });
  };

  /**
   * Syncs tasks with the server by clearing local storage and refetching data.
   */
  const handleFetchFromServer = async () => {
    setIsSyncing(true);
    await AsyncStorage.setItem('todos', JSON.stringify([]));
    await queryClient.invalidateQueries('todos');
    setIsSyncing(false);
    setModalState({...modalState, confirmSync: false});
  };

  /**
   * Filters the displayed tasks based on the selected filter type.
   */
  const filteredTodos = useMemo(() => {
    if (!todos) {
      return [];
    }
    if (filter === 'All') {
      return todos;
    }
    return todos.filter(todo =>
      filter === 'Pending' ? !todo.completed : todo.completed,
    );
  }, [todos, filter]);

  if (isLoading || isSyncing) {
    return <SyncIndicator message="Syncing with server..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <View style={styles.headerSubContainer}>
          <Pressable
            onPress={() => setModalState({...modalState, confirmSync: true})}
            style={({pressed}) => [
              styles.fetchButton,
              pressed && styles.pressedStyle,
            ]}>
            <Text style={styles.fetchIcon}>🔄</Text>
          </Pressable>
          <Text style={styles.networkStatus}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>
      </View>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {filterArr.map(status => (
          <Pressable
            key={status}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={({pressed}) => [
              styles.filterButton,
              filter === status && styles.activeFilter,
              pressed && styles.pressedStyle,
            ]}
            onPress={() => setFilter(status as any)}>
            <Text
              style={[
                styles.filterText,
                filter !== status && styles.activeFilterText,
              ]}>
              {status}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* List of task */}
      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.taskView}>
            <Pressable
              style={({pressed}) => [
                styles.checkbox,
                item.completed && styles.checked,
                pressed && styles.pressedStyle,
              ]}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              onPress={() => {
                toggleComplete(item);
                ToastAndroid.show(
                  `Marked as ${item.completed ? 'Pending' : 'Completed'} `,
                  ToastAndroid.BOTTOM,
                );
              }}>
              {item.completed && <Text style={styles.checkmark}>✔</Text>}
            </Pressable>
            <View style={styles.taskContainer}>
              <Text numberOfLines={2} style={styles.task}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
            </View>
            <View style={styles.actionButtons}>
              <Pressable
                style={({pressed}) => [pressed && styles.pressedStyle]}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                onPress={() => openEditModal(item)}>
                <Text style={styles.editButton}>✏️</Text>
              </Pressable>
              <Pressable
                style={({pressed}) => [pressed && styles.pressedStyle]}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                onPress={() => deleteTodo.mutate(item.id)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      {/* Add task button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={({pressed}) => [
            styles.addButton,
            pressed && styles.pressedStyle,
          ]}
          onPress={() => {
            resetModal();
            setModalState({...modalState, addTask: true});
          }}>
          <Text style={styles.addButtonText}>Add Task</Text>
        </Pressable>
      </View>
      {/* Add & Edit Task Modal */}
      <Modal
        visible={modalState.addTask}
        animationType="fade"
        transparent
        onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={taskData.title}
              onChangeText={text => setTaskData({...taskData, title: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Task Description"
              value={taskData.description}
              onChangeText={text =>
                setTaskData({...taskData, description: text})
              }
            />
            <View style={styles.buttonRow}>
              <Pressable
                style={({pressed}) => [
                  styles.confirmButton,
                  pressed && styles.pressedStyle,
                ]}
                onPress={handleAddOrEditTask}>
                <Text style={styles.confirmButtonText}>
                  {taskData.id ? 'Update' : 'Add'}
                </Text>
              </Pressable>
              <Pressable
                style={({pressed}) => [
                  styles.cancelButton,
                  pressed && styles.pressedStyle,
                ]}
                onPress={() => setModalState({...modalState, addTask: false})}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Confirm Sync Modal */}
      <Modal
        visible={modalState.confirmSync}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setModalState({...modalState, confirmSync: false})
        }>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>
              Are you sure you want to sync? This will replace local tasks with
              server tasks.
            </Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={({pressed}) => [
                  styles.confirmButton,
                  pressed && styles.pressedStyle,
                ]}
                onPress={handleFetchFromServer}>
                <Text style={styles.confirmButtonText}> Yes</Text>
              </Pressable>
              <Pressable
                onPress={() => resetModal()}
                style={({pressed}) => [
                  styles.cancelButton,
                  pressed && styles.pressedStyle,
                ]}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: widthRatio(16),
    borderBottomWidth: 1,
    borderColor: colors.alto,
  },
  headerTitle: {
    fontSize: widthRatio(20),
    fontWeight: 'bold',
    marginHorizontal: widthRatio(16),
  },
  headerSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: widthRatio(16),
  },
  fetchButton: {
    padding: widthRatio(10),
    borderRadius: widthRatio(5),
    marginRight: widthRatio(10),
  },
  fetchIcon: {
    fontSize: widthRatio(18),
    color: colors.white,
  },
  networkStatus: {
    fontSize: widthRatio(16),
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: widthRatio(16),
    paddingHorizontal: widthRatio(16),
  },
  filterButton: {
    padding: widthRatio(10),
    borderRadius: widthRatio(5),
    backgroundColor: colors.alto,
    marginRight: widthRatio(18),
  },
  activeFilter: {
    backgroundColor: colors.cerulean,
  },
  filterText: {
    fontSize: widthRatio(14),
    color: colors.black,
  },
  activeFilterText: {
    color: colors.white,
  },
  taskView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: widthRatio(10),
    borderRadius: widthRatio(5),
    marginBottom: widthRatio(10),
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: widthRatio(5),
    elevation: 3,
    marginHorizontal: widthRatio(16),
  },
  checkbox: {
    width: widthRatio(24),
    height: widthRatio(24),
    borderWidth: 2,
    borderColor: colors.cerulean,
    borderRadius: widthRatio(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: widthRatio(10),
  },
  checked: {
    backgroundColor: colors.cerulean,
  },
  checkmark: {
    color: colors.white,
    fontWeight: 'bold',
  },
  taskContainer: {
    flex: 1,
  },
  task: {
    fontSize: widthRatio(16),
    fontWeight: 'bold',
  },
  description: {
    fontSize: widthRatio(14),
    color: colors.emperor,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    fontSize: widthRatio(18),
    margin: widthRatio(5),
  },
  deleteButton: {
    fontSize: widthRatio(18),
    margin: widthRatio(5),
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: widthRatio(15),
  },
  addButton: {
    backgroundColor: colors.cerulean,
    padding: widthRatio(10),
    borderRadius: widthRatio(5),
    alignItems: 'center',
    width: '93%',
    marginBottom: widthRatio(8),
  },
  addButtonText: {
    color: colors.white,
    fontSize: widthRatio(16),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: colors.white,
    padding: widthRatio(20),
    borderRadius: widthRatio(10),
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: widthRatio(10),
    borderWidth: 1,
    borderColor: colors.alto,
    borderRadius: widthRatio(5),
    marginBottom: widthRatio(10),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pressedStyle: {
    opacity: 0.7,
  },
  modalText: {
    fontSize: widthRatio(16),
    textAlign: 'center',
    marginBottom: widthRatio(20),
  },
  confirmButton: {
    backgroundColor: colors.cerulean,
    padding: widthRatio(10),
    borderRadius: widthRatio(5),
    alignItems: 'center',
    width: '45%',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: widthRatio(16),
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.punch,
    padding: widthRatio(10),
    borderRadius: widthRatio(5),
    alignItems: 'center',
    width: '45%',
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: widthRatio(16),
    fontWeight: 'bold',
  },
});

export default AllTasks;
