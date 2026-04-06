import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

export const useTaskData = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        
        const mappedData: Task[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Task>(item));
        
        for (const item of mappedData) {
          try {
            await tasksCollection.update(sanitizePayload(item));
          } catch {
            await tasksCollection.insert(sanitizePayload(item));
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving tasks from local vault.");
        return await tasksCollection.getAll();
      }
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const task: Task = sanitizePayload({
        ...newTask,
        id: newTask.id || crypto.randomUUID(),
        dueDate: newTask.dueDate || new Date().toISOString(),
        completed: newTask.completed || false,
        isDeleted: false
      } as Task);

      const supabasePayload = {
        id: task.id,
        animal_id: task.animalId,
        title: task.title,
        notes: task.notes,
        due_date: task.dueDate,
        completed: task.completed,
        type: task.type,
        recurring: task.recurring,
        assigned_to: task.assignedTo,
        updated_at: task.updatedAt,
        is_deleted: task.isDeleted
      };

      try {
        const { error } = await supabase.from('tasks').insert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Adding task locally.");
      }
      await tasksCollection.insert(task);
      return task;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedTask = sanitizePayload({ ...task, completed: true });
      
      try {
        const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
        if (error) throw error;
      } catch {
        console.warn("Offline: Completing task locally.");
      }
      await tasksCollection.update(updatedTask);
      return updatedTask;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");
      
      const updatedTask = sanitizePayload({ ...task, isDeleted: true });
      
      try {
        const { error } = await supabase.from('tasks').update({ is_deleted: true }).eq('id', taskId);
        if (error) throw error;
      } catch {
        console.warn("Offline: Deleting task locally.");
      }
      await tasksCollection.update(updatedTask);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  return { 
    tasks: tasks.filter(t => !t.isDeleted), 
    isLoading, 
    addTask: addTaskMutation.mutateAsync, 
    completeTask: completeTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync
  };
};
