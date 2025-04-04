/**
 * @file WeeklyPlanner.tsx
 * @description A weekly planner component that allows users to manage tasks across days,
 * including drag-and-drop, editing, clipboard operations, and billing folder management.
 */

import React, {
  useState,
  useCallback,
  DragEvent,
  MouseEvent,
  KeyboardEvent,
  ChangeEvent,
  FC,
  memo,
} from "react";

/**
 * @interface Task
 * @property {number} id - Unique identifier for the task.
 * @property {string} title - Title of the task.
 * @property {string} description - Description of the task.
 * @property {number} points - Points associated with the task.
 */
interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
}

/**
 * @typedef {Record<string, Task[]>} TasksState
 * A state object mapping day names to arrays of tasks.
 */
type TasksState = Record<string, Task[]>;

/**
 * @typedef { { singleTask: Task } | { multiTasks: Task[] } | null } DraggedTaskState
 * Represents the state of a single or multiple tasks being dragged.
 */
type DraggedTaskState = null | { singleTask: Task } | { multiTasks: Task[] };

/**
 * @typedef {"copy" | "cut"} ClipboardMode
 * Specifies the clipboard mode for tasks.
 */
type ClipboardMode = "copy" | "cut";

/**
 * @typedef {Object} TaskFormData
 * @property {string} title - The title of the task.
 * @property {string} description - The description of the task.
 * @property {number} points - The points value of the task.
 */
interface TaskFormData {
  title: string;
  description: string;
  points: number;
}

/**
 * @typedef {Object} TaskCardProps
 * @property {Task} task - The task to display.
 * @property {boolean} isSelected - Indicates if the task is selected.
 * @property {(task: Task, isCtrl: boolean) => void} onSelect - Callback when the task is selected.
 * @property {(task: Task, e: MouseEvent<HTMLButtonElement>) => void} onEdit - Callback when editing is triggered.
 * @property {(task: Task, e: DragEvent<HTMLDivElement>) => void} onDragStart - Callback when drag starts.
 */

/**
 * Renders a card for a single task.
 *
 * @param {TaskCardProps} props - Props for the TaskCard component.
 * @returns {JSX.Element} A rendered task card.
 */
const TaskCard: FC<TaskCardProps> = memo(
  ({ task, isSelected, onSelect, onEdit, onDragStart }) => {
    return (
      <div
        className={`p-2 rounded shadow text-sm relative group transition-all duration-150 ease-in-out ${
          isSelected
            ? "bg-blue-100 border-2 border-blue-400 ring-2 ring-blue-300"
            : "bg-white hover:bg-gray-50"
        } cursor-grab`}
        draggable
        onDragStart={(e) => onDragStart(task, e)}
        onClick={(e) => onSelect(task, e.ctrlKey || e.metaKey)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (isSelected && (e.ctrlKey || e.metaKey)) {
            if (e.key === "x" || e.key === "X") {
              e.preventDefault();
              // Trigger cut externally via parent handler if needed
            } else if (e.key === "c" || e.key === "C") {
              e.preventDefault();
              // Trigger copy externally via parent handler if needed
            }
          }
        }}
        tabIndex={0}
        role="listitem"
        aria-grabbed={isSelected}
        aria-selected={isSelected}
      >
        <div className="flex justify-between items-start">
          <div className="flex-grow mr-2">
            <h3 className="font-semibold break-words">{task.title}</h3>
          </div>
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={(e) => onEdit(task, e)}
              className="text-gray-400 hover:text-blue-600 mr-1 p-1 rounded-full hover:bg-gray-200 transition-colors duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs"
              aria-label={`Modifier la tâche ${task.title}`}
              title="Modifier la tâche"
            >
              ✏️
            </button>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">
              {task.points} pts
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1 break-words">
          {task.description}
        </p>
      </div>
    );
  }
);

/**
 * @typedef {Object} EditModalProps
 * @property {Task} task - The task being edited.
 * @property {TaskFormData} formData - The form data for editing the task.
 * @property {(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void} onChange - Handler for input changes.
 * @property {() => void} onClose - Callback to close the modal.
 * @property {() => void} onSave - Callback to save the changes.
 */

/**
 * Modal component for editing a task.
 *
 * @param {EditModalProps} props - Props for the EditModal component.
 * @returns {JSX.Element} A rendered edit modal.
 */
const EditModal: FC<EditModalProps> = ({
  task,
  formData,
  onChange,
  onClose,
  onSave,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200"
          aria-label="Fermer la fenêtre de modification"
        >
          &times;
        </button>
        <h2 id="edit-modal-title" className="text-xl font-bold mb-5">
          Modifier la tâche
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Titre
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={onChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="points"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Points
              </label>
              <input
                id="points"
                name="points"
                type="number"
                min={0}
                value={formData.points}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors duration-150 font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * WeeklyPlanner component.
 *
 * This component allows the management of tasks across days of the week including
 * drag-and-drop, editing, and clipboard operations.
 *
 * @returns {JSX.Element} The rendered WeeklyPlanner component.
 */
const WeeklyPlanner: FC = () => {
  // Days of the week
  const weekdays: string[] = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  // State declarations
  const [tasks, setTasks] = useState<TasksState>({
    Lundi: [
      {
        id: 1,
        title: "Réunion d'équipe",
        description: "9h - Point hebdomadaire",
        points: 2,
      },
      {
        id: 2,
        title: "Analyse des besoins",
        description: "Recueillir les besoins client",
        points: 5,
      },
    ],
    Mardi: [
      {
        id: 3,
        title: "Conception UI",
        description: "Créer les maquettes",
        points: 8,
      },
      {
        id: 4,
        title: "Revue de code",
        description: "Revue des PR en attente",
        points: 3,
      },
    ],
    Mercredi: [
      {
        id: 5,
        title: "Développement API",
        description: "Endpoints backend",
        points: 13,
      },
    ],
    Jeudi: [
      {
        id: 6,
        title: "Tests fonctionnels",
        description: "Tests d'acceptation",
        points: 5,
      },
      {
        id: 7,
        title: "Documentation",
        description: "Mise à jour de la doc technique",
        points: 3,
      },
    ],
    Vendredi: [
      {
        id: 8,
        title: "Déploiement",
        description: "Mise en production v1.2",
        points: 8,
      },
    ],
    Samedi: [],
    Dimanche: [],
  });
  const [folder, setFolder] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<DraggedTaskState>(null);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [clipboard, setClipboard] = useState<Task[]>([]);
  const [clipboardMode, setClipboardMode] = useState<ClipboardMode>("copy");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    points: 0,
  });

  /**
   * Handles the selection of a task.
   *
   * @param {Task} task - The task to be selected.
   * @param {boolean} isCtrlPressed - Whether the Ctrl key is pressed.
   */
  const selectTask = useCallback(
    (task: Task, isCtrlPressed: boolean): void => {
      if (isCtrlPressed) {
        const isAlreadySelected = selectedTasks.some((t) => t.id === task.id);
        setSelectedTasks(
          isAlreadySelected
            ? selectedTasks.filter((t) => t.id !== task.id)
            : [...selectedTasks, task]
        );
      } else {
        setSelectedTasks(
          selectedTasks.length === 1 && selectedTasks[0].id === task.id
            ? []
            : [task]
        );
      }
    },
    [selectedTasks]
  );

  /**
   * Copies the selected tasks to the clipboard.
   */
  const copySelectedTasks = useCallback((): void => {
    if (selectedTasks.length > 0) {
      if (clipboardMode === "cut") {
        setClipboard([]);
      }
      setClipboard([...selectedTasks]);
      setClipboardMode("copy");
    }
  }, [selectedTasks, clipboardMode]);

  /**
   * Cuts the selected tasks and removes them from their source.
   */
  const cutSelectedTasks = useCallback((): void => {
    if (selectedTasks.length > 0) {
      setClipboard([...selectedTasks]);
      setClipboardMode("cut");

      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };
        selectedTasks.forEach((taskToCut) => {
          const sourceDay = Object.keys(newTasks).find((day) =>
            newTasks[day].some((t) => t.id === taskToCut.id)
          );
          if (sourceDay) {
            newTasks[sourceDay] = newTasks[sourceDay].filter(
              (t) => t.id !== taskToCut.id
            );
          }
        });
        return newTasks;
      });
      setSelectedTasks([]);
    }
  }, [selectedTasks]);

  /**
   * Pastes tasks from the clipboard to the specified day.
   *
   * @param {string} day - The target day for pasting tasks.
   */
  const pasteTasksToDay = useCallback(
    (day: string): void => {
      if (clipboard.length === 0) return;

      setTasks((currentTasks) => {
        const newTasks = { ...currentTasks };
        const allTaskIds = Object.values(newTasks)
          .flat()
          .map((task) => task.id);
        let nextId = allTaskIds.length > 0 ? Math.max(...allTaskIds) + 1 : 1;

        if (clipboardMode === "cut") {
          newTasks[day] = [...newTasks[day], ...clipboard];
          setClipboard([]);
          setClipboardMode("copy");
        } else {
          const taskCopies = clipboard.map((task) => ({
            ...task,
            id: nextId++,
          }));
          newTasks[day] = [...newTasks[day], ...taskCopies];
        }
        return newTasks;
      });
    },
    [clipboard, clipboardMode]
  );

  /**
   * Adds the selected tasks to the billing folder.
   */
  const addSelectedTasksToFolder = useCallback((): void => {
    if (selectedTasks.length > 0) {
      const newTasksForFolder = selectedTasks.filter(
        (task) => !folder.some((folderTask) => folderTask.id === task.id)
      );
      if (newTasksForFolder.length > 0) {
        setFolder((prevFolder) => [...prevFolder, ...newTasksForFolder]);
      }
      setSelectedTasks([]);
    }
  }, [selectedTasks, folder]);

  /**
   * Removes a task from the billing folder.
   *
   * @param {number} taskId - The ID of the task to remove.
   */
  const removeFromFolder = useCallback((taskId: number): void => {
    setFolder((prevFolder) => prevFolder.filter((task) => task.id !== taskId));
  }, []);

  /**
   * Opens the edit modal for the specified task.
   *
   * @param {Task} task - The task to be edited.
   * @param {MouseEvent<HTMLButtonElement>} [e] - The mouse event.
   */
  const openEditModal = useCallback(
    (task: Task, e?: MouseEvent<HTMLButtonElement>): void => {
      e?.stopPropagation();
      setCurrentTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        points: task.points,
      });
      setIsModalOpen(true);
    },
    []
  );

  /**
   * Closes the edit modal.
   */
  const closeModal = useCallback((): void => {
    setIsModalOpen(false);
    setCurrentTask(null);
  }, []);

  /**
   * Saves the changes made in the edit modal to the task.
   */
  const saveChanges = useCallback((): void => {
    if (!currentTask) return;
    const updatedTaskData: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      points: formData.points,
    };

    setTasks((currentTasks) => {
      const newTasks = { ...currentTasks };
      for (const day of weekdays) {
        const taskIndex = newTasks[day].findIndex(
          (t) => t.id === currentTask.id
        );
        if (taskIndex !== -1) {
          newTasks[day][taskIndex] = {
            ...newTasks[day][taskIndex],
            ...updatedTaskData,
          };
          break;
        }
      }
      return newTasks;
    });

    setSelectedTasks((currentSelected) =>
      currentSelected.map((t) =>
        t.id === currentTask.id ? { ...t, ...updatedTaskData } : t
      )
    );

    setFolder((currentFolder) =>
      currentFolder.map((t) =>
        t.id === currentTask.id ? { ...t, ...updatedTaskData } : t
      )
    );

    closeModal();
  }, [currentTask, formData, weekdays, closeModal]);

  /**
   * Initiates dragging of a task.
   *
   * @param {Task} task - The task being dragged.
   * @param {DragEvent<HTMLDivElement>} e - The drag event.
   */
  const handleDragStart = useCallback(
    (task: Task, e: DragEvent<HTMLDivElement>): void => {
      const isTaskSelected = selectedTasks.some((t) => t.id === task.id);
      let draggedData: DraggedTaskState;

      if (isTaskSelected && selectedTasks.length > 1) {
        draggedData = { multiTasks: selectedTasks };
        if (e.dataTransfer) {
          e.dataTransfer.setData(
            "text/plain",
            `${selectedTasks.length} tâches sélectionnées`
          );
          e.dataTransfer.effectAllowed = "move";
        }
      } else {
        draggedData = { singleTask: task };
        if (e.dataTransfer) {
          e.dataTransfer.setData("text/plain", `task-${task.id}`);
          e.dataTransfer.effectAllowed = "move";
        }
        if (!isTaskSelected || selectedTasks.length > 1) {
          setSelectedTasks([task]);
        }
      }
      setDraggedTask(draggedData);
    },
    [selectedTasks]
  );

  /**
   * Handles the drag over event to allow dropping.
   *
   * @param {DragEvent<HTMLDivElement>} e - The drag event.
   */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }, []);

  /**
   * Handles the drop event for a day column.
   *
   * @param {DragEvent<HTMLDivElement>} e - The drop event.
   * @param {string} targetDayName - The target day where tasks will be dropped.
   */
  const handleDayDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetDayName: string): void => {
      e.preventDefault();
      if (!draggedTask) return;

      const tasksToMove: Task[] =
        "multiTasks" in draggedTask
          ? draggedTask.multiTasks
          : [draggedTask.singleTask!];

      setTasks((currentTasks) => {
        const newTasks = { ...currentTasks };
        let changed = false;

        tasksToMove.forEach((taskToMove) => {
          let sourceDay: string | undefined;
          for (const day of weekdays) {
            if (newTasks[day].some((t) => t.id === taskToMove.id)) {
              sourceDay = day;
              break;
            }
          }
          if (sourceDay && sourceDay !== targetDayName) {
            newTasks[sourceDay] = newTasks[sourceDay].filter(
              (t) => t.id !== taskToMove.id
            );
            if (!newTasks[targetDayName].some((t) => t.id === taskToMove.id)) {
              newTasks[targetDayName] = [
                ...newTasks[targetDayName],
                taskToMove,
              ];
            }
            changed = true;
          }
        });
        return changed ? newTasks : currentTasks;
      });

      setDraggedTask(null);
    },
    [draggedTask, weekdays]
  );

  /**
   * Handles the drop event for the billing folder.
   *
   * @param {DragEvent<HTMLDivElement>} e - The drop event.
   */
  const handleFolderDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      if (!draggedTask) return;

      const tasksToAdd: Task[] =
        "multiTasks" in draggedTask
          ? draggedTask.multiTasks
          : [draggedTask.singleTask!];

      const newTasksForFolder = tasksToAdd.filter(
        (task) => !folder.some((folderTask) => folderTask.id === task.id)
      );

      if (newTasksForFolder.length > 0) {
        setFolder((prevFolder) => [...prevFolder, ...newTasksForFolder]);
      }
      setDraggedTask(null);
    },
    [draggedTask, folder]
  );

  /**
   * Handles changes in the edit modal form.
   *
   * @param {ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The form change event.
   */
  const handleFormChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { name, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: name === "points" ? parseInt(value, 10) || 0 : value,
      }));
    },
    []
  );

  // --- JSX Rendering ---
  return (
    <div className="flex flex-col p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Planning Hebdomadaire</h1>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-8">
        {weekdays.map((day) => (
          <div
            key={day}
            className="bg-gray-200 rounded p-2 flex flex-col min-h-[200px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDayDrop(e, day)}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold">{day}</h2>
              <button
                onClick={() => pasteTasksToDay(day)}
                disabled={clipboard.length === 0}
                className={`px-2 py-1 rounded text-xs transition-colors duration-150 ${
                  clipboard.length > 0
                    ? clipboardMode === "cut"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                title={
                  clipboardMode === "cut"
                    ? "Déplacer les tâches coupées ici (Ctrl+V equivalent)"
                    : "Coller les tâches copiées ici (Ctrl+V equivalent)"
                }
              >
                {clipboardMode === "cut" ? "✂️ Coller" : "📋 Coller"}
              </button>
            </div>
            <div className="space-y-2 flex-grow">
              {tasks[day].map((task) => {
                const isSelected = selectedTasks.some((t) => t.id === task.id);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={isSelected}
                    onSelect={selectTask}
                    onEdit={openEditModal}
                    onDragStart={handleDragStart}
                  />
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300 text-right">
              <span className="font-bold text-gray-700 text-sm">
                Total: {tasks[day].reduce((sum, task) => sum + task.points, 0)}{" "}
                pts
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-3 rounded shadow mb-6 sticky bottom-0 border border-gray-200">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="font-semibold">
              {selectedTasks.length} tâche(s) sélectionnée(s)
            </span>
            <span className="ml-4 text-sm text-gray-700">
              (Total:{" "}
              {selectedTasks.reduce((sum, task) => sum + task.points, 0)}{" "}
              points)
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={cutSelectedTasks}
              disabled={selectedTasks.length === 0}
              className={`px-3 py-1.5 rounded text-sm transition-colors duration-150 ${
                selectedTasks.length > 0
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title="Couper la sélection (Ctrl+X)"
            >
              ✂️ Couper
            </button>
            <button
              onClick={copySelectedTasks}
              disabled={selectedTasks.length === 0}
              className={`px-3 py-1.5 rounded text-sm transition-colors duration-150 ${
                selectedTasks.length > 0
                  ? "bg-gray-500 text-white hover:bg-gray-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title="Copier la sélection (Ctrl+C)"
            >
              📋 Copier
            </button>
            <button
              onClick={addSelectedTasksToFolder}
              disabled={selectedTasks.length === 0}
              className={`px-3 py-1.5 rounded text-sm transition-colors duration-150 ${
                selectedTasks.length > 0
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title="Ajouter la sélection au dossier de facturation"
            >
              ➕ Ajouter au dossier
            </button>
          </div>
        </div>
      </div>
      <div
        className="border-2 border-dashed border-blue-400 p-4 rounded bg-blue-50 mb-6 text-center"
        onDragOver={handleDragOver}
        onDrop={handleFolderDrop}
        aria-label="Zone de dépôt pour le dossier de facturation"
      >
        <h2 className="font-bold mb-1">Dossier de facturation</h2>
        <p className="text-sm text-gray-600">
          Déposez des tâches ici pour les ajouter (elles restent aussi dans le
          planning).
        </p>
      </div>
      <div className="bg-white rounded p-4 shadow mb-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="font-bold">
            Contenu du dossier ({folder.length} tâches)
          </h2>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold text-sm">
            Total: {folder.reduce((sum, task) => sum + task.points, 0)} points
          </div>
        </div>
        {folder.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Le dossier est vide. Glissez/déposez des tâches ou utilisez le
            bouton "Ajouter au dossier".
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {folder.map((task) => (
              <div
                key={`folder-${task.id}`}
                className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                role="listitem"
              >
                <div className="flex-grow mr-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm break-words">
                      {task.title}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 ml-2 rounded-full text-xs font-semibold flex-shrink-0">
                      {task.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 break-words">
                    {task.description}
                  </p>
                </div>
                <button
                  onClick={() => removeFromFolder(task.id)}
                  className="text-red-500 hover:text-red-700 ml-2 px-2 py-1 rounded hover:bg-red-100 transition-colors duration-150 flex-shrink-0"
                  aria-label={`Retirer ${task.title} du dossier`}
                  title="Retirer du dossier"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {isModalOpen && currentTask && (
        <EditModal
          task={currentTask}
          formData={formData}
          onChange={handleFormChange}
          onClose={closeModal}
          onSave={saveChanges}
        />
      )}
    </div>
  );
};

export default WeeklyPlanner;
