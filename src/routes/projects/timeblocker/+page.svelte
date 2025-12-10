<script>
  import { onMount, tick } from "svelte";
  import TaskForm from "./TaskForm.svelte";
  import DayTimeline from "./DayTimeline.svelte";
  import EditIcon from "$lib/icons/edit.svelte";
  import TrashIcon from "$lib/icons/trash.svelte";
  import CalendarPlusIcon from "$lib/icons/calendar-plus.svelte";
  import { exportToCalendar } from "./calendarExport.js";

  let tasks = [];
  let scheduledBlocks = [];
  let showTaskForm = false;
  let editingTask = null;
  let isAutoScheduling = false;
  let autoScheduleError = null;
  let showWeekendSelector = false;
  let weekendDays = ["Saturday", "Sunday"]; // Default weekend days

  onMount(() => {
    loadFromStorage();
  });

  function loadFromStorage() {
    try {
      const savedTasks = localStorage.getItem("timeblocker-tasks");
      const savedBlocks = localStorage.getItem("timeblocker-blocks");
      const savedWeekendDays = localStorage.getItem("timeblocker-weekend-days");

      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        tasks = tasks.map((task) => ({
          ...task,
          preference: task.preference || "any time",
        }));
      }

      if (savedBlocks) {
        scheduledBlocks = JSON.parse(savedBlocks);
      }

      if (savedWeekendDays) {
        weekendDays = JSON.parse(savedWeekendDays);
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem("timeblocker-tasks", JSON.stringify(tasks));
      localStorage.setItem(
        "timeblocker-blocks",
        JSON.stringify(scheduledBlocks)
      );
      localStorage.setItem(
        "timeblocker-weekend-days",
        JSON.stringify(weekendDays)
      );
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  }

  function toggleWeekendDay(day) {
    if (weekendDays.includes(day)) {
      weekendDays = weekendDays.filter((d) => d !== day);
    } else {
      weekendDays = [...weekendDays, day];
    }
    saveToStorage();
  }

  function handleExportToCalendar() {
    // Show weekend selector if there are work tasks and modal is not already open
    const hasWorkTasks = scheduledTasks.some((task) => task.color === "work");

    if (hasWorkTasks && !showWeekendSelector) {
      showWeekendSelector = true;
      return;
    }

    // Proceed with export (either no work tasks, or user clicked export in modal)
    try {
      if (scheduledTasks.length === 0) {
        alert(
          "No scheduled tasks to export. Please schedule some tasks first."
        );
        return;
      }
      exportToCalendar(scheduledTasks, new Date(), weekendDays);
      showWeekendSelector = false;
    } catch (error) {
      console.error("Error exporting to calendar:", error);
      alert(`Failed to export calendar: ${error.message}`);
    }
  }

  function addTask(task) {
    // Generate a unique ID using timestamp + random number to avoid duplicates
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask = {
      id: uniqueId,
      name: task.name,
      duration: task.duration,
      preference: task.preference || "any time",
      color: task.color || task.category || "work", // Support both color and category
      bufferBefore: task.bufferBefore || 0,
      bufferAfter: task.bufferAfter || 0,
      createdAt: new Date().toISOString(),
    };
    tasks = [...tasks, newTask];
    saveToStorage();
  }

  function handleTasksCreated(event) {
    const createdTasks = event.detail;
    // Add each task to the task list
    // IDs are generated with timestamp + random string to ensure uniqueness
    createdTasks.forEach((task) => {
      addTask(task);
    });
  }

  async function updateTask(taskId, updates) {
    const updatesWithPreference = {
      ...updates,
      preference: updates.preference || "any time",
    };
    tasks = tasks.map((t) =>
      t.id === taskId ? { ...t, ...updatesWithPreference } : t
    );
    scheduledBlocks = scheduledBlocks.map((block) => {
      if (block.taskId === taskId) {
        const { duration, name, ...otherUpdates } = updates;
        const blockUpdates = { ...otherUpdates };
        if (duration !== undefined) {
          blockUpdates.duration = duration / 60;
        }
        return { ...block, ...blockUpdates };
      }
      return block;
    });
    await tick();
    saveToStorage();
  }

  function deleteTask(taskId) {
    tasks = tasks.filter((t) => t.id !== taskId);
    scheduledBlocks = scheduledBlocks.filter(
      (block) => block.taskId !== taskId
    );
    saveToStorage();
  }

  function clearAllTasks() {
    if (
      confirm(
        "Are you sure you want to clear all tasks? This action cannot be undone."
      )
    ) {
      tasks = [];
      scheduledBlocks = [];
      saveToStorage();
    }
  }

  async function autoScheduleTasks(startHour = 6, endHour = 22) {
    const unscheduled = tasks.filter(
      (task) => !scheduledBlocks.some((block) => block.taskId === task.id)
    );

    if (unscheduled.length === 0) {
      autoScheduleError = "No unscheduled tasks to schedule";
      return;
    }

    isAutoScheduling = true;
    autoScheduleError = null;

    try {
      const response = await fetch("/projects/timeblocker/api/schedule-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: unscheduled,
          startHour: startHour,
          endHour: endHour,
          existingScheduledBlocks: scheduledBlocks.map((block) => ({
            startHour: block.startHour,
            duration: block.duration,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to schedule tasks");
      }

      const data = await response.json();

      if (data.scheduledBlocks && data.scheduledBlocks.length > 0) {
        // Schedule each block
        for (const block of data.scheduledBlocks) {
          const task = tasks.find((t) => t.id === block.taskId);
          if (task) {
            // scheduleTask expects duration in hours (decimal)
            await scheduleTask(block.taskId, block.startHour, block.duration);
          }
        }

        // Build warning message
        const messages = [];
        const scheduledCount = data.scheduledBlocks.length;

        if (scheduledCount > 0) {
          messages.push(
            `Scheduled ${scheduledCount} task${scheduledCount !== 1 ? "s" : ""}`
          );
        }

        if (data.unscheduledTasks && data.unscheduledTasks.length > 0) {
          const unscheduledTaskNames = data.unscheduledTasks
            .map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              return task ? task.name : taskId;
            })
            .join(", ");
          messages.push(
            `${data.unscheduledTasks.length} task${data.unscheduledTasks.length !== 1 ? "s" : ""} (${unscheduledTaskNames}) could not be scheduled within the selected time range`
          );
        }

        if (data.overlappingTasks && data.overlappingTasks.length > 0) {
          const overlappingTaskNames = data.overlappingTasks
            .map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              return task ? task.name : taskId;
            })
            .join(", ");
          messages.push(
            `Warning: ${data.overlappingTasks.length} task${data.overlappingTasks.length !== 1 ? "s" : ""} (${overlappingTaskNames}) could not be scheduled due to overlaps with existing tasks`
          );
        }

        if (messages.length > 0) {
          autoScheduleError = messages.join(". ") + ".";
        }
      } else {
        let errorMsg = "No tasks could be scheduled within the time range.";
        if (data.overlappingTasks && data.overlappingTasks.length > 0) {
          const overlappingTaskNames = data.overlappingTasks
            .map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              return task ? task.name : taskId;
            })
            .join(", ");
          errorMsg += ` ${data.overlappingTasks.length} task${data.overlappingTasks.length !== 1 ? "s" : ""} (${overlappingTaskNames}) would overlap with existing scheduled tasks.`;
        }
        autoScheduleError = errorMsg;
      }
    } catch (error) {
      console.error("Error auto-scheduling tasks:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to schedule tasks. Please try again.";
      autoScheduleError = errorMessage;
    } finally {
      isAutoScheduling = false;
    }
  }

  async function scheduleTask(taskId, startHour, duration) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      return;
    }

    const filteredBlocks = scheduledBlocks.filter(
      (block) => block.taskId !== taskId
    );

    // Generate a unique ID using timestamp + random number to avoid duplicates
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newBlock = {
      id: uniqueId,
      taskId,
      startHour,
      duration,
      color: task.color || "work",
    };

    scheduledBlocks = [...filteredBlocks, newBlock];
    await tick();
    saveToStorage();
  }

  async function updateBlock(blockId, updates) {
    scheduledBlocks = scheduledBlocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    await tick();
    saveToStorage();
  }

  async function deleteBlock(blockId) {
    scheduledBlocks = scheduledBlocks.filter((block) => block.id !== blockId);
    await tick();
    saveToStorage();
  }

  function openTaskForm(task = null) {
    editingTask = task;
    showTaskForm = true;
  }

  function closeTaskForm() {
    showTaskForm = false;
    editingTask = null;
  }

  function handleTaskSubmit(event) {
    const taskData = event.detail;
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    closeTaskForm();
  }

  $: unscheduledTasks = tasks.filter(
    (task) => !scheduledBlocks.some((block) => block.taskId === task.id)
  );

  $: scheduledTasks = (() => {
    const result = scheduledBlocks
      .map((block) => {
        const task = tasks.find((t) => t.id === block.taskId);
        if (task) {
          return { ...task, ...block };
        }
        return null;
      })
      .filter(Boolean);
    return [...result];
  })();
</script>

<svelte:head>
  <title>TimeBlocker - Daily Routine Planner</title>
  <meta
    name="description"
    content="Plan your daily routine with ease by organizing tasks into time blocks."
  />
</svelte:head>

<section class="timeblocker-container">
  <div class="header">
    <div class="header-content">
      <div>
        <div class="title-wrapper">
          <span class="title-icon">
            <svelte:component this={CalendarPlusIcon} />
          </span>
          <h1 class="title">TimeBlocker</h1>
        </div>
        <p class="subtitle">Plan your daily routine with ease</p>
      </div>
      {#if scheduledTasks.length > 0}
        <div class="export-actions">
          <button
            class="export-btn"
            on:click={handleExportToCalendar}
            title="Export to Google Calendar or Apple Calendar"
          >
            📅 Export to Calendar
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="main-content">
    <div class="tasks-panel">
      <div class="tasks-panel-header">
        <h2>Tasks</h2>
        <div class="header-actions">
          <button class="add-task-btn" on:click={() => openTaskForm()}>
            + Add Task
          </button>
        </div>
      </div>

      {#if unscheduledTasks.length > 0}
        <div class="unscheduled-tasks">
          <h3>Unscheduled</h3>
          {#each unscheduledTasks as task (task.id)}
            <div
              class="task-item"
              draggable="true"
              data-task-id={task.id}
              on:dragstart={(e) => {
                e.dataTransfer.setData("text/plain", task.id);
                e.dataTransfer.effectAllowed = "move";
              }}
            >
              <div
                class="task-color"
                style="background-color: {task.color === 'work'
                  ? '#77d2ff'
                  : '#fde72d'};"
              ></div>
              <div class="task-info">
                <div class="task-name">{task.name}</div>
                <div class="task-meta">
                  <span>{task.duration} min</span>
                  {#if task.preference}
                    <span class="preference-badge">{task.preference}</span>
                  {/if}
                </div>
              </div>
              <div class="task-actions">
                <button
                  class="icon-btn"
                  on:click={() => openTaskForm(task)}
                  title="Edit task"
                >
                  <EditIcon />
                </button>
                <button
                  class="icon-btn"
                  on:click={() => deleteTask(task.id)}
                  title="Delete task"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if tasks.length === 0}
        <div class="empty-state">
          <p>No tasks yet. Click "Add Task" to get started!</p>
        </div>
      {:else}
        <div class="tasks-footer">
          {#if unscheduledTasks.length > 0}
            <button
              class="auto-schedule-btn"
              on:click={() => autoScheduleTasks(6, 22)}
              disabled={isAutoScheduling}
              title="Auto-schedule all unscheduled tasks"
            >
              {#if isAutoScheduling}
                ⏳ Auto Schedule
              {:else}
                🤖 Auto Schedule
              {/if}
            </button>
          {/if}
          {#if autoScheduleError}
            <div class="auto-schedule-error">{autoScheduleError}</div>
          {/if}
          <button
            class="clear-all-btn"
            on:click={clearAllTasks}
            title="Clear all tasks"
          >
            Clear All Tasks
          </button>
        </div>
      {/if}
    </div>

    <div class="timeline-panel">
      <DayTimeline
        {scheduledTasks}
        {scheduleTask}
        {updateBlock}
        {deleteBlock}
        {tasks}
        {openTaskForm}
      />
    </div>
  </div>
</section>

{#if showTaskForm}
  <TaskForm
    task={editingTask}
    on:submit={handleTaskSubmit}
    on:tasksCreated={handleTasksCreated}
    on:close={closeTaskForm}
  />
{/if}

{#if showWeekendSelector}
  <div class="modal-overlay" on:click={() => (showWeekendSelector = false)}>
    <div class="modal-content" on:click|stopPropagation>
      <h2>Select Weekend Days</h2>
      <p class="modal-description">
        Work-related tasks will repeat only on weekdays (excluding selected
        weekend days).
      </p>
      <div class="weekend-options">
        {#each ["Friday", "Saturday", "Sunday"] as day}
          <label class="weekend-option">
            <input
              type="checkbox"
              checked={weekendDays.includes(day)}
              on:change={() => toggleWeekendDay(day)}
            />
            <span>{day}</span>
          </label>
        {/each}
      </div>
      <div class="modal-actions">
        <button class="modal-btn primary" on:click={handleExportToCalendar}>
          Export Calendar
        </button>
        <button
          class="modal-btn"
          on:click={() => (showWeekendSelector = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style scoped lang="scss">
  .timeblocker-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 2rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .title-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      flex-shrink: 0;
      color: #77d2ff;
      transition: transform 0.25s ease;

      :global(svg) {
        width: 100%;
        height: 100%;
      }

      &:hover {
        transform: scale(1.1);
        color: #fde72d;
      }
    }

    .title {
      font-size: 3rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(45deg, #77d2ff 0%, #fde72d 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .export-actions {
      display: flex;
      gap: 1rem;
    }

    .export-btn {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      &:active {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 2rem;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
    }
  }

  .tasks-panel {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 250px);
    overflow-y: auto;

    .tasks-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h2 {
        font-size: 1.5rem;
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
      }

      .add-task-btn {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    h3 {
      font-size: 1rem;
      margin: 1rem 0 0.5rem 0;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tasks-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .auto-schedule-btn {
      padding: 0.5rem 1rem;
      background: linear-gradient(45deg, #77d2ff 0%, #fde72d 100%);
      border: none;
      border-radius: 8px;
      color: #000;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(119, 210, 255, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .auto-schedule-error {
      color: #ff6b6b;
      font-size: 0.8rem;
      padding: 0.5rem;
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid rgba(255, 107, 107, 0.2);
      border-radius: 6px;
      text-align: center;
    }

    .clear-all-btn {
      padding: 0.5rem 1rem;
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid rgba(255, 107, 107, 0.3);
      border-radius: 8px;
      color: #ff6b6b;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 107, 107, 0.15);
        border-color: rgba(255, 107, 107, 0.4);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: grab;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateX(4px);
    }

    &:active {
      cursor: grabbing;
    }

    .task-color {
      width: 4px;
      height: 100%;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .task-info {
      flex: 1;
      min-width: 0;

      .task-name {
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 0.25rem;
      }

      .task-meta {
        display: flex;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);

        .preference-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          text-transform: capitalize;
        }
      }
    }

    .task-actions {
      display: flex;
      gap: 0.25rem;
    }
  }

  .icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s ease;
    color: rgba(255, 255, 255, 0.7);
    width: 24px;
    height: 24px;

    :global(svg) {
      width: 100%;
      height: 100%;
    }

    &:hover {
      opacity: 1;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: rgba(20, 20, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

    h2 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .modal-description {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .weekend-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .weekend-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: rgba(255, 255, 255, 0.9);

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      span {
        font-size: 1rem;
        font-weight: 500;
      }
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .modal-btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      &.primary {
        background: linear-gradient(45deg, #77d2ff 0%, #fde72d 100%);
        color: #000;
        border: none;

        &:hover {
          opacity: 0.9;
        }
      }
    }
  }

  .timeline-panel {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    overflow-x: auto;
  }
</style>
