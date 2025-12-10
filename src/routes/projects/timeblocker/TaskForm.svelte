<script>
  import { createEventDispatcher } from "svelte";
  import CloseIcon from "$lib/icons/close.svelte";

  export let task = null;

  const dispatch = createEventDispatcher();

  // Tab management
  let activeTab = task ? 'form' : 'form'; // Default to form tab

  const preferences = ["morning", "any time", "afternoon", "evening"];
  const colorOptions = [
    { value: "work", label: "Work", color: "#77d2ff" },
    { value: "personal", label: "Personal", color: "#fde72d" },
  ];

  const durationPresets = [
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 240, label: "4 hours" },
  ];

  let name = task?.name || "";
  let duration = task?.duration || 30;
  let preference = task?.preference || "any time";
  let color = task?.color || "work";
  let bufferBefore = task?.bufferBefore || 0;
  let bufferAfter = task?.bufferAfter || 0;

  let initialDuration = parseInt(task?.duration || 30, 10);
  let matchingPreset = durationPresets.find((p) => p.value === initialDuration);
  let durationMode = matchingPreset ? "preset" : "custom";
  let customDuration = matchingPreset ? initialDuration : task?.duration || 30;

  const predefinedTasks = [
    {
      name: "Exercise",
      duration: 30,
      preference: "morning",
      color: "personal",
    },
    { name: "Deep Work", duration: 60, preference: "any time", color: "work" },
    {
      name: "Read Book",
      duration: 30,
      preference: "evening",
      color: "personal",
    },
    {
      name: "Meditation",
      duration: 15,
      preference: "morning",
      color: "personal",
    },
    { name: "Meeting", duration: 30, preference: "any time", color: "work" },
  ];

  let selectedTemplate = "custom";

  $: if (
    duration === null ||
    duration === undefined ||
    isNaN(parseInt(duration, 10))
  ) {
    duration = 30;
  }

  $: if (durationMode === "custom") {
    const parsedCustom = parseInt(customDuration, 10);
    if (!isNaN(parsedCustom) && parsedCustom >= 5) {
      duration = parsedCustom;
    } else if (isNaN(parsedCustom) || parsedCustom < 5) {
      customDuration = 30;
      duration = 30;
    }
  }

  function handleTemplateSelect(template) {
    name = template.name;
    duration = template.duration;
    preference = template.preference;
    color = template.color;
    selectedTemplate = template.name;
    const matchingPreset = durationPresets.find((p) => p.value === duration);
    if (matchingPreset) {
      durationMode = "preset";
    } else {
      durationMode = "custom";
      customDuration = duration;
    }
  }

  function handleDurationPresetSelect(presetValue) {
    durationMode = "preset";
    duration = presetValue;
    customDuration = presetValue;
  }

  function handleCustomDurationMode() {
    durationMode = "custom";
    const currentDuration = parseInt(duration, 10);
    if (!isNaN(currentDuration) && currentDuration >= 5) {
      customDuration = currentDuration;
    } else {
      customDuration = 30;
      duration = 30;
    }
  }

  function handleSubmit() {
    const taskName = (name || "").trim();
    if (!taskName) {
      alert("Please enter a task name");
      return;
    }

    const taskDuration = parseInt(duration, 10);
    if (isNaN(taskDuration) || taskDuration < 5) {
      alert("Please enter a valid duration (minimum 5 minutes)");
      return;
    }

    const taskPreference = preference || "any time";
    const taskColor = color || "work";

    const taskBufferBefore = parseInt(bufferBefore, 10) || 0;
    const taskBufferAfter = parseInt(bufferAfter, 10) || 0;

    dispatch("submit", {
      name: taskName,
      duration: taskDuration,
      preference: taskPreference,
      color: taskColor,
      bufferBefore: Math.max(0, taskBufferBefore),
      bufferAfter: Math.max(0, taskBufferAfter),
    });
  }

  function handleClose() {
    // Reset AI mode state when closing
    if (activeTab === 'ai') {
      taskText = '';
      processingError = null;
    }
    activeTab = 'form';
    dispatch("close");
  }

  // AI Mode functionality
  let taskText = '';
  let isProcessingTasks = false;
  let processingError = null;

  async function processTasksFromText() {
    if (!taskText.trim()) {
      processingError = 'Please enter some text';
      return;
    }

    isProcessingTasks = true;
    processingError = null;

    let timeoutId;
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      const response = await fetch('/projects/timeblocker/api/process-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: taskText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process tasks');
      }

      const data = await response.json();
      
      if (data.tasks && data.tasks.length > 0) {
        // Dispatch the tasks to the parent component
        dispatch('tasksCreated', data.tasks);
        // Clear the text input and close
        taskText = '';
        handleClose();
      } else {
        processingError = 'No tasks were extracted from the text';
      }
    } catch (error) {
      // Clear timeout if it hasn't fired yet
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.error('Error processing tasks:', error);
      let errorMessage = 'Failed to process tasks. Please try again.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'Request timeout: The task processing took longer than 30 seconds. Please try again with a shorter description.';
        } else {
          errorMessage = error.message;
        }
      }
      
      processingError = errorMessage;
    } finally {
      isProcessingTasks = false;
    }
  }
</script>

<div class="modal-overlay" on:click={handleClose}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>{task ? "Edit Task" : "Add New Task"}</h2>
      <button class="close-btn" on:click={handleClose} title="Close">
        <CloseIcon />
      </button>
    </div>

    {#if !task}
      <div class="tabs">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'form'}
          on:click={() => activeTab = 'form'}
        >
          Form
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'ai'}
          on:click={() => activeTab = 'ai'}
        >
          🤖 AI Mode
        </button>
      </div>
    {/if}

    {#if activeTab === 'form' || task}
      <form on:submit|preventDefault={handleSubmit} class="task-form">
      {#if !task}
        <div class="form-group">
          <label>Quick Add</label>
          <div class="template-buttons">
            {#each predefinedTasks as template}
              <button
                type="button"
                class="template-button"
                class:selected={selectedTemplate === template.name}
                on:click={() => handleTemplateSelect(template)}
              >
                <span class="template-name">{template.name}</span>
                <span class="template-details">
                  {template.duration} min · {template.preference}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="form-group">
        <label for="task-name">Task Name</label>
        <input
          id="task-name"
          type="text"
          bind:value={name}
          placeholder="e.g., Morning Exercise"
          required
          autofocus
        />
      </div>

      <div class="form-group">
        <label>Duration</label>
        <div class="duration-options">
          {#each durationPresets as preset}
            <button
              type="button"
              class="duration-preset-button"
              class:selected={durationMode === "preset" &&
                duration === preset.value}
              on:click={() => handleDurationPresetSelect(preset.value)}
            >
              {preset.label}
            </button>
          {/each}
          <button
            type="button"
            class="duration-preset-button"
            class:selected={durationMode === "custom"}
            on:click={handleCustomDurationMode}
          >
            Custom
          </button>
        </div>
        {#if durationMode === "custom"}
          <input
            id="task-duration"
            type="number"
            bind:value={customDuration}
            min="5"
            max="480"
            step="5"
            placeholder="Enter minutes"
            required
            class="custom-duration-input"
          />
        {/if}
      </div>

      <div class="form-group">
        <label for="task-preference">Preferred Time</label>
        <select id="task-preference" bind:value={preference}>
          {#each preferences as pref}
            <option value={pref}>{pref}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label>Buffer Time (minutes)</label>
        <div class="buffer-inputs">
          <div class="buffer-input-group">
            <label for="buffer-before">Before</label>
            <input
              id="buffer-before"
              type="number"
              bind:value={bufferBefore}
              min="0"
              max="120"
              step="5"
              placeholder="0"
            />
          </div>
          <div class="buffer-input-group">
            <label for="buffer-after">After</label>
            <input
              id="buffer-after"
              type="number"
              bind:value={bufferAfter}
              min="0"
              max="120"
              step="5"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Category</label>
        <div class="color-options">
          {#each colorOptions as option}
            <label class="color-option">
              <input type="radio" value={option.value} bind:group={color} />
              <div
                class="color-preview"
                style="background-color: {option.color};"
              ></div>
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" on:click={handleClose}>
          Cancel
        </button>
        <button type="submit" class="btn-submit">
          {task ? "Update" : "Add"} Task
        </button>
      </div>
    </form>
    {:else}
      <!-- AI Mode Tab -->
      <div class="ai-mode-content">
        <div class="form-group">
          <label for="task-text-input">Describe your tasks</label>
          <p class="help-text">Example: "Morning routine: meditation for 15 minutes, then breakfast and emails. Afternoon: client call at 2pm and finish the presentation."</p>
          <textarea
            id="task-text-input"
            bind:value={taskText}
            placeholder="Type your tasks here...&#10;&#10;Example: Morning routine: meditation for 15 minutes, then breakfast and emails. Afternoon: client call at 2pm and finish the presentation."
            rows="6"
            disabled={isProcessingTasks}
          ></textarea>
        </div>

        {#if processingError}
          <div class="error-message">{processingError}</div>
        {/if}

        <div class="form-actions">
          <button 
            class="btn-cancel" 
            on:click={handleClose}
            disabled={isProcessingTasks}
          >
            Cancel
          </button>
          <button 
            class="btn-process" 
            on:click={processTasksFromText}
            disabled={isProcessingTasks || !taskText.trim()}
          >
            {#if isProcessingTasks}
              Processing...
            {:else}
              Create Tasks
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style scoped lang="scss">
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: rgba(20, 20, 25, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s ease;
      padding: 0;

      :global(svg) {
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    padding: 0 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    justify-content: center;
  }

  .tab-btn {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: -1px;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    &.active {
      color: rgba(255, 255, 255, 0.9);
      border-bottom-color: #77d2ff;
    }
  }

  .ai-mode-content {
    padding: 1.5rem;

    .form-group {
      label {
        display: block;
        margin-bottom: 0.5rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        font-size: 0.95rem;
      }

      textarea {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        font-family: inherit;
        resize: vertical;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: #77d2ff;
          box-shadow: 0 0 0 3px rgba(119, 210, 255, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  }

  .help-text {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .error-message {
    color: #ff6b6b;
    font-size: 0.85rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.2);
    border-radius: 8px;
  }

  .btn-process {
    background: linear-gradient(45deg, #77d2ff 0%, #fde72d 100%);
    color: #000;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
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


  .task-form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      font-size: 0.95rem;
    }

    input[type="text"],
    input[type="number"],
    select {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #77d2ff;
        box-shadow: 0 0 0 3px rgba(119, 210, 255, 0.1);
        background: rgba(255, 255, 255, 0.08);
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }

    select {
      cursor: pointer;
    }
  }

  .template-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .duration-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .duration-preset-button {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
      color: rgba(255, 255, 255, 0.9);
    }

    &:active {
      transform: translateY(0);
    }

    &.selected {
      background: rgba(119, 210, 255, 0.15);
      border-color: rgba(119, 210, 255, 0.4);
      box-shadow: 0 0 0 2px rgba(119, 210, 255, 0.1);
      color: rgba(255, 255, 255, 1);
    }
  }

  .custom-duration-input {
    margin-top: 0.5rem;
  }

  .template-button {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    font-family: inherit;
    text-align: left;
    min-width: 0;
    flex: 1 1 auto;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &.selected {
      background: rgba(119, 210, 255, 0.15);
      border-color: rgba(119, 210, 255, 0.4);
      box-shadow: 0 0 0 2px rgba(119, 210, 255, 0.1);
    }

    .template-name {
      font-weight: 500;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      white-space: nowrap;
    }

    .template-details {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
    }
  }

  .color-options {
    display: flex;
    gap: 1rem;
  }

  .buffer-inputs {
    display: flex;
    gap: 1rem;
  }

  .buffer-input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    input {
      margin: 0;
    }
  }

  .color-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;

    input[type="radio"] {
      display: none;
    }

    .color-preview {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    span {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    input[type="radio"]:checked + .color-preview {
      border-color: rgba(255, 255, 255, 0.6);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    input[type="radio"]:checked ~ span {
      color: rgba(255, 255, 255, 1);
    }

    &:has(input[type="radio"]:checked) {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-cancel,
  .btn-submit {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .btn-submit {
    background: linear-gradient(45deg, #77d2ff 0%, #fde72d 100%);
    color: #000;
    border: none;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(119, 210, 255, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

</style>
