// atlas-ui/react/static/js/Utils/TaskSystem.tsx
import { getItem, setItem } from "./b64.tsx";

export type TaskType = "exploration" | "mining" | "trading" | "combat" | "research";

export type TaskStatus = "active" | "completed" | "failed" | "expired" | "claimed";

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  requirements: {
    [key: string]: number; // 任务要求，例如 { "planetsDiscovered": 5, "resourcesMined": 100 }
  };
  progress: {
    [key: string]: number; // 任务进度
  };
  rewards: {
    antimatter?: number;
    element115?: number;
    deuterium?: number;
    quantumAlloy?: number;
    plasmaCell?: number;
    neuralCircuit?: number;
    exoticCrystal?: number;
    nebulaDust?: number;
    blackHoleFragment?: number;
    ancientRelic?: number;
    alienArtifact?: number;
    dimensionalShard?: number;
  };
  createdAt: number;
  expiresAt?: number; // 任务过期时间（可选）
  completedAt?: number; // 任务完成时间（可选）
}

type TaskEventListener = (tasks: Task[]) => void;

export class TaskSystem {
  private static readonly STORAGE_KEY = "_atlasTasks";
  private static listeners: TaskEventListener[] = [];

  static initialize(): void {
    const tasks = this.getTasks();
    if (tasks.length === 0) {
      // 初始化默认任务
      this.createDefaultTasks();
    }
  }

  static addListener(listener: TaskEventListener): void {
    this.listeners.push(listener);
  }

  static removeListener(listener: TaskEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private static notifyListeners(): void {
    const tasks = this.getTasks();
    this.listeners.forEach(listener => listener(tasks));
  }

  private static createDefaultTasks(): void {
    const defaultTasks: Task[] = [
      {
        id: "task_1",
        title: "初次探索",
        description: "发现5个新行星",
        type: "exploration",
        status: "active",
        requirements: { planetsDiscovered: 5 },
        progress: { planetsDiscovered: 0 },
        rewards: {
          antimatter: 100,
          element115: 50,
          deuterium: 75
        },
        createdAt: Date.now()
      },
      {
        id: "task_2",
        title: "资源收集者",
        description: "收集100单位的反物质",
        type: "mining",
        status: "active",
        requirements: { antimatterCollected: 100 },
        progress: { antimatterCollected: 0 },
        rewards: {
          quantumAlloy: 5,
          plasmaCell: 3
        },
        createdAt: Date.now()
      },
      {
        id: "task_3",
        title: "星系旅行者",
        description: "访问2个不同的星系",
        type: "exploration",
        status: "active",
        requirements: { galaxiesVisited: 2 },
        progress: { galaxiesVisited: 0 },
        rewards: {
          exoticCrystal: 2,
          nebulaDust: 3
        },
        createdAt: Date.now()
      }
    ];

    this.saveTasks(defaultTasks);
  }

  static getTasks(): Task[] {
    try {
      const stored = getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const tasks = JSON.parse(stored);
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error("Error reading tasks:", error);
      return [];
    }
  }

  private static saveTasks(tasks: Task[]): void {
    try {
      setItem(this.STORAGE_KEY, JSON.stringify(tasks));
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  }

  static createTask(task: Omit<Task, "id" | "createdAt" | "status" | "progress">): Task {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "active",
      progress: Object.fromEntries(Object.keys(task.requirements).map(key => [key, 0])),
      createdAt: Date.now()
    };

    const tasks = this.getTasks();
    tasks.push(newTask);
    this.saveTasks(tasks);

    return newTask;
  }

  static updateTaskProgress(taskId: string, progressUpdates: { [key: string]: number }): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      return;
    }

    const task = tasks[taskIndex];
    if (task.status !== "active") {
      return;
    }

    // 更新进度
    Object.entries(progressUpdates).forEach(([key, value]) => {
      if (task.progress.hasOwnProperty(key)) {
        task.progress[key] = Math.min(value, task.requirements[key]);
      }
    });

    // 检查任务是否完成
    const isCompleted = Object.entries(task.requirements).every(([key, required]) => {
      return task.progress[key] >= required;
    });

    if (isCompleted) {
      task.status = "completed";
      task.completedAt = Date.now();
    }

    // 检查任务是否过期
    if (task.expiresAt && Date.now() > task.expiresAt && task.status === "active") {
      task.status = "expired";
    }

    tasks[taskIndex] = task;
    this.saveTasks(tasks);
  }

  static incrementProgress(progressKey: string, amount: number = 1): void {
    const tasks = this.getTasks();
    let updated = false;

    tasks.forEach((task, index) => {
      if (task.status === "active" && task.progress.hasOwnProperty(progressKey)) {
        const currentProgress = task.progress[progressKey];
        const requirement = task.requirements[progressKey];
        const newProgress = Math.min(currentProgress + amount, requirement);
        
        if (newProgress !== currentProgress) {
          task.progress[progressKey] = newProgress;
          
          // 检查任务是否完成
          const isCompleted = Object.entries(task.requirements).every(([key, required]) => {
            return task.progress[key] >= required;
          });

          if (isCompleted) {
            task.status = "completed";
            task.completedAt = Date.now();
          }

          tasks[index] = task;
          updated = true;
        }
      }
    });

    if (updated) {
      this.saveTasks(tasks);
    }
  }

  static completeTask(taskId: string): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      return null;
    }

    const task = tasks[taskIndex];
    if (task.status !== "active") {
      return null;
    }

    task.status = "completed";
    task.completedAt = Date.now();

    tasks[taskIndex] = task;
    this.saveTasks(tasks);

    return task;
  }

  static claimTaskReward(taskId: string): Task | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1 || tasks[taskIndex].status !== "completed") {
      return null;
    }

    const task = tasks[taskIndex];
    task.status = "claimed";
    tasks[taskIndex] = task;
    this.saveTasks(tasks);

    return task;
  }

  static getActiveTasks(): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(task => task.status === "active");
  }

  static getCompletedTasks(): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(task => task.status === "completed");
  }

  static getTaskById(taskId: string): Task | null {
    const tasks = this.getTasks();
    const task = tasks.find(task => task.id === taskId);
    return task || null;
  }

  static deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    this.saveTasks(filteredTasks);
  }

  static reset(): void {
    setItem(this.STORAGE_KEY, JSON.stringify([]));
    this.createDefaultTasks();
  }
}
