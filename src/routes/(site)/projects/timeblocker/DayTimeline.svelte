<script>
  import { onMount } from 'svelte';
  import TimeBlock from './TimeBlock.svelte';

  export let scheduledTasks = [];
  export let scheduleTask;
  export let updateBlock;
  export let deleteBlock;
  export let tasks = [];
  export let openTaskForm;

  let timelineRef;
  let dragOverHour = null;

  const timeRangePresets = [
    { label: '24 Hours', start: 0, end: 24 },
    { label: '6 AM - 9 PM', start: 6, end: 21 },
    { label: '7 AM - 10 PM', start: 7, end: 22 },
    { label: 'Custom', start: 0, end: 24, isCustom: true }
  ];

  let selectedRange = '24 Hours';
  let customStartHour = 0;
  let customEndHour = 24;
  let showCustomInputs = false;
  let savedCustomStartHour = 0;
  let savedCustomEndHour = 24;

  function loadTimeRangeSettings() {
    try {
      const savedSettings = localStorage.getItem('timeblocker-timeRange');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        selectedRange = settings.selectedRange || '24 Hours';
        
        savedCustomStartHour = settings.customStartHour ?? 0;
        savedCustomEndHour = settings.customEndHour ?? 24;
        
        if (selectedRange === 'Custom') {
          showCustomInputs = true;
          customStartHour = savedCustomStartHour;
          customEndHour = savedCustomEndHour;
        } else {
          showCustomInputs = false;
          const preset = timeRangePresets.find(p => p.label === selectedRange);
          if (preset && !preset.isCustom) {
            customStartHour = preset.start;
            customEndHour = preset.end;
          } else {
            customStartHour = savedCustomStartHour;
            customEndHour = savedCustomEndHour;
          }
        }
      }
    } catch (error) {
      console.error('Error loading time range settings:', error);
    }
  }

  function saveTimeRangeSettings() {
    try {
      const settings = {
        selectedRange,
        customStartHour: savedCustomStartHour,
        customEndHour: savedCustomEndHour
      };
      localStorage.setItem('timeblocker-timeRange', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving time range settings:', error);
    }
  }

  onMount(() => {
    loadTimeRangeSettings();
  });

  function formatHour(hour, includeMinutes = true) {
    const hourInt = Math.floor(hour);
    const minutes = includeMinutes ? Math.round((hour % 1) * 60) : 0;
    const displayHour = hourInt === 0 ? 12 : hourInt > 12 ? hourInt - 12 : hourInt;
    const period = hourInt < 12 ? 'AM' : 'PM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  function formatHourLabel(hour) {
    return formatHour(hour, false);
  }

  function handleRangeChange(event) {
    const selected = event.target.value;
    selectedRange = selected;
    
    const preset = timeRangePresets.find(p => p.label === selected);
    if (preset) {
      if (preset.isCustom) {
        showCustomInputs = true;
        customStartHour = savedCustomStartHour;
        customEndHour = savedCustomEndHour;
      } else {
        showCustomInputs = false;
        customStartHour = preset.start;
        customEndHour = preset.end;
      }
    }
    saveTimeRangeSettings();
  }

  function handleCustomStartChange(event) {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0 && value < 24) {
      customStartHour = value;
      savedCustomStartHour = value;
      if (customStartHour >= customEndHour) {
        customEndHour = Math.min(24, customStartHour + 1);
        savedCustomEndHour = customEndHour;
      }
      saveTimeRangeSettings();
    }
  }

  function handleCustomEndChange(event) {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= 24) {
      customEndHour = value;
      savedCustomEndHour = value;
      if (customEndHour <= customStartHour) {
        customStartHour = Math.max(0, customEndHour - 1);
        savedCustomStartHour = customStartHour;
      }
      saveTimeRangeSettings();
    }
  }

  $: visibleHours = Array.from({ length: customEndHour - customStartHour }, (_, i) => customStartHour + i);
  $: displayRange = `${formatHour(customStartHour)} - ${formatHour(customEndHour)}`;

  function handleDragOver(event, hour) {
    event.preventDefault();
    dragOverHour = hour;
  }

  function handleDragLeave() {
    dragOverHour = null;
  }

  function handleDrop(event, hour) {
    event.preventDefault();
    dragOverHour = null;

    const taskId = event.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const hourContent = event.currentTarget.querySelector('.hour-content');
    if (!hourContent) return;

    const rect = hourContent.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const hourHeight = hourContent.offsetHeight;
    const hourOffset = y / hourHeight;
    
    const exactStartHour = hour + hourOffset;
    const durationHours = task.duration / 60;
    const roundedStartHour = Math.round(exactStartHour * 4) / 4;

    if (canDropAtHour(roundedStartHour, taskId, durationHours)) {
      scheduleTask(taskId, roundedStartHour, durationHours);
    } else {
      alert('Cannot schedule task here - it overlaps with an existing task');
    }
  }

  $: blocksForVisibleHours = visibleHours.map(hour => ({
    hour,
    blocks: scheduledTasks.filter(task => Math.floor(task.startHour) === hour)
  }));

  function canDropAtHour(hour, taskId, durationHours) {
    const endHour = hour + durationHours;

    if (hour < 0 || endHour > 24) {
      return false;
    }

    for (const scheduled of scheduledTasks) {
      if (scheduled.taskId === taskId) continue;
      
      const scheduledStart = scheduled.startHour;
      const scheduledEnd = scheduled.startHour + scheduled.duration;

      if (
        (hour >= scheduledStart && hour < scheduledEnd) ||
        (endHour > scheduledStart && endHour <= scheduledEnd) ||
        (hour <= scheduledStart && endHour >= scheduledEnd)
      ) {
        return false;
      }
    }

    return true;
  }
</script>

<div 
  class="day-timeline" 
  bind:this={timelineRef}
>
  <div class="timeline-header">
    <h2>Daily Schedule</h2>
    <div class="header-controls">
      <div class="time-range-selector">
        <select 
          class="range-select"
          value={selectedRange}
          on:change={handleRangeChange}
        >
          {#each timeRangePresets as preset}
            <option value={preset.label}>{preset.label}</option>
          {/each}
        </select>
        {#if showCustomInputs}
          <div class="custom-inputs">
            <input
              type="number"
              class="custom-hour-input"
              min="0"
              max="23"
              value={customStartHour}
              on:input={handleCustomStartChange}
              placeholder="Start"
            />
            <span class="range-separator">-</span>
            <input
              type="number"
              class="custom-hour-input"
              min="1"
              max="24"
              value={customEndHour}
              on:input={handleCustomEndChange}
              placeholder="End"
            />
          </div>
        {:else}
          <span class="time-range-display">{displayRange}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="timeline-grid">
    {#each blocksForVisibleHours as { hour, blocks } (hour)}
      <div 
        class="hour-slot"
        data-hour={hour}
        class:drop-zone={dragOverHour === hour}
        on:dragover={(e) => handleDragOver(e, hour)}
        on:dragleave={handleDragLeave}
        on:drop={(e) => handleDrop(e, hour)}
      >
        <div class="hour-label">
          {formatHourLabel(hour)}
        </div>
        <div class="hour-content">
          {#each blocks as task (task.id)}
            <TimeBlock
              {task}
              {tasks}
              {updateBlock}
              {deleteBlock}
              {scheduleTask}
              {openTaskForm}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if scheduledTasks.length === 0}
    <div class="empty-timeline">
      <p>Drag tasks from the left panel to schedule them</p>
    </div>
  {/if}
</div>

<style scoped lang="scss">
  .day-timeline {
    min-height: 600px;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
    flex-wrap: wrap;

    h2 {
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .time-range-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .range-select {
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }

      &:focus {
        outline: none;
        border-color: #77d2ff;
        box-shadow: 0 0 0 3px rgba(119, 210, 255, 0.1);
      }
    }

    .custom-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .custom-hour-input {
      width: 60px;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      text-align: center;
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

    .range-separator {
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    .time-range-display {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      font-weight: 500;
    }
  }

  .timeline-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: visible;
    position: relative;
  }

  .hour-slot {
    min-height: 60px;
    display: grid;
    grid-template-columns: 80px 1fr;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    transition: background-color 0.2s ease;
    overflow: visible;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    &.drop-zone {
      background: rgba(119, 210, 255, 0.1);
      border-color: rgba(119, 210, 255, 0.3);
    }
  }

  .hour-label {
    padding: 0.75rem 1rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.02);
  }

  .hour-content {
    padding: 0.25rem;
    position: relative;
    min-height: 60px;
    overflow: visible;
  }

  .empty-timeline {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.5);

    p {
      font-size: 1.1rem;
    }
  }
</style>
