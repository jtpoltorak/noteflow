import {
  faUsers, faBullseye, faCalendarCheck, faUserFriends, faBug,
  faFlag, faCalendarDay, faPlane, faCalendarDays, faBook,
  faMicroscope, faGraduationCap, faPenFancy, faUtensils, faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type TemplateCategory = 'Work' | 'Planning' | 'Learning' | 'Personal';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: IconDefinition;
  category: TemplateCategory;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  // ── Work ───────────────────────────────────────────────────
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture agenda, attendees, decisions, and action items',
    icon: faUsers,
    category: 'Work',
    content: `
      <h2>Meeting Notes</h2>
      <p><strong>Date:</strong> </p>
      <p><strong>Attendees:</strong> </p>
      <h3>Agenda</h3>
      <ul><li><p></p></li></ul>
      <h3>Discussion</h3>
      <p></p>
      <h3>Decisions</h3>
      <ul><li><p></p></li></ul>
      <h3>Action Items</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
    `,
  },
  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Define objectives, scope, timeline, and stakeholders',
    icon: faBullseye,
    category: 'Work',
    content: `
      <h2>Project Brief</h2>
      <h3>Objective</h3>
      <p></p>
      <h3>Scope</h3>
      <ul><li><p></p></li></ul>
      <h3>Timeline</h3>
      <p><strong>Start:</strong> </p>
      <p><strong>End:</strong> </p>
      <h3>Stakeholders</h3>
      <ul><li><p></p></li></ul>
      <h3>Success Criteria</h3>
      <ul><li><p></p></li></ul>
      <h3>Risks & Mitigations</h3>
      <ul><li><p></p></li></ul>
    `,
  },
  {
    id: 'one-on-one',
    name: '1-on-1 Meeting',
    description: 'Structure for recurring one-on-one conversations',
    icon: faUserFriends,
    category: 'Work',
    content: `
      <h2>1-on-1 Meeting</h2>
      <p><strong>Date:</strong> </p>
      <p><strong>With:</strong> </p>
      <h3>Check-in</h3>
      <p></p>
      <h3>Updates & Progress</h3>
      <ul><li><p></p></li></ul>
      <h3>Challenges & Blockers</h3>
      <ul><li><p></p></li></ul>
      <h3>Feedback</h3>
      <p></p>
      <h3>Action Items</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
    `,
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Document bugs with steps to reproduce and expected behavior',
    icon: faBug,
    category: 'Work',
    content: `
      <h2>Bug Report</h2>
      <p><strong>Severity:</strong> </p>
      <p><strong>Reported by:</strong> </p>
      <h3>Summary</h3>
      <p></p>
      <h3>Steps to Reproduce</h3>
      <ol><li><p></p></li></ol>
      <h3>Expected Behavior</h3>
      <p></p>
      <h3>Actual Behavior</h3>
      <p></p>
      <h3>Environment</h3>
      <ul><li><p>OS: </p></li><li><p>Browser: </p></li><li><p>Version: </p></li></ul>
      <h3>Screenshots / Logs</h3>
      <p></p>
    `,
  },

  // ── Planning ───────────────────────────────────────────────
  {
    id: 'goal-setting',
    name: 'Goal Setting',
    description: 'Set and track goals with milestones and deadlines',
    icon: faFlag,
    category: 'Planning',
    content: `
      <h2>Goal Setting</h2>
      <h3>Goal</h3>
      <p></p>
      <h3>Why It Matters</h3>
      <p></p>
      <h3>Key Results</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
      <h3>Milestones</h3>
      <ol><li><p></p></li></ol>
      <h3>Deadline</h3>
      <p></p>
      <h3>Progress Notes</h3>
      <p></p>
    `,
  },
  {
    id: 'daily-plan',
    name: 'Daily Plan',
    description: 'Plan your day with priorities, tasks, and reflections',
    icon: faCalendarDay,
    category: 'Planning',
    content: `
      <h2>Daily Plan</h2>
      <p><strong>Date:</strong> </p>
      <h3>Top Priorities</h3>
      <ol><li><p></p></li></ol>
      <h3>Tasks</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
      <h3>Notes</h3>
      <p></p>
      <h3>End of Day Reflection</h3>
      <p></p>
    `,
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Reflect on the past week and plan the next one',
    icon: faCalendarCheck,
    category: 'Planning',
    content: `
      <h2>Weekly Review</h2>
      <p><strong>Week of:</strong> </p>
      <h3>Accomplishments</h3>
      <ul><li><p></p></li></ul>
      <h3>Challenges</h3>
      <ul><li><p></p></li></ul>
      <h3>Lessons Learned</h3>
      <p></p>
      <h3>Next Week's Focus</h3>
      <ol><li><p></p></li></ol>
      <h3>Carry-over Tasks</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
    `,
  },
  {
    id: 'travel-itinerary',
    name: 'Travel Itinerary',
    description: 'Plan trips with flights, accommodation, and daily activities',
    icon: faPlane,
    category: 'Planning',
    content: `
      <h2>Travel Itinerary</h2>
      <p><strong>Destination:</strong> </p>
      <p><strong>Dates:</strong> </p>
      <h3>Travel Details</h3>
      <ul><li><p>Flight/Transport: </p></li><li><p>Accommodation: </p></li><li><p>Confirmation #: </p></li></ul>
      <h3>Day 1</h3>
      <ul><li><p></p></li></ul>
      <h3>Day 2</h3>
      <ul><li><p></p></li></ul>
      <h3>Packing List</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
    `,
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    description: 'Organize events with venue, guests, and task checklist',
    icon: faCalendarDays,
    category: 'Planning',
    content: `
      <h2>Event Planning</h2>
      <p><strong>Event:</strong> </p>
      <p><strong>Date:</strong> </p>
      <p><strong>Venue:</strong> </p>
      <h3>Guest List</h3>
      <ul><li><p></p></li></ul>
      <h3>Budget</h3>
      <ul><li><p></p></li></ul>
      <h3>To-Do</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
      <h3>Notes</h3>
      <p></p>
    `,
  },

  // ── Learning ───────────────────────────────────────────────
  {
    id: 'book-article-notes',
    name: 'Book / Article Notes',
    description: 'Summarize key ideas, quotes, and takeaways',
    icon: faBook,
    category: 'Learning',
    content: `
      <h2>Book / Article Notes</h2>
      <p><strong>Title:</strong> </p>
      <p><strong>Author:</strong> </p>
      <h3>Summary</h3>
      <p></p>
      <h3>Key Ideas</h3>
      <ul><li><p></p></li></ul>
      <h3>Favorite Quotes</h3>
      <blockquote><p></p></blockquote>
      <h3>Takeaways & Applications</h3>
      <ul><li><p></p></li></ul>
    `,
  },
  {
    id: 'research-summary',
    name: 'Research Summary',
    description: 'Organize findings, sources, and conclusions',
    icon: faMicroscope,
    category: 'Learning',
    content: `
      <h2>Research Summary</h2>
      <p><strong>Topic:</strong> </p>
      <h3>Research Question</h3>
      <p></p>
      <h3>Sources</h3>
      <ul><li><p></p></li></ul>
      <h3>Key Findings</h3>
      <ul><li><p></p></li></ul>
      <h3>Analysis</h3>
      <p></p>
      <h3>Conclusions</h3>
      <p></p>
      <h3>Further Reading</h3>
      <ul><li><p></p></li></ul>
    `,
  },
  {
    id: 'course-notes',
    name: 'Course Notes',
    description: 'Capture lecture content, key concepts, and questions',
    icon: faGraduationCap,
    category: 'Learning',
    content: `
      <h2>Course Notes</h2>
      <p><strong>Course:</strong> </p>
      <p><strong>Lesson/Topic:</strong> </p>
      <p><strong>Date:</strong> </p>
      <h3>Key Concepts</h3>
      <ul><li><p></p></li></ul>
      <h3>Detailed Notes</h3>
      <p></p>
      <h3>Questions</h3>
      <ul><li><p></p></li></ul>
      <h3>Review / Summary</h3>
      <p></p>
    `,
  },

  // ── Personal ───────────────────────────────────────────────
  {
    id: 'journal-entry',
    name: 'Journal Entry',
    description: 'Free-form daily journaling with prompts',
    icon: faPenFancy,
    category: 'Personal',
    content: `
      <h2>Journal Entry</h2>
      <p><strong>Date:</strong> </p>
      <h3>How am I feeling?</h3>
      <p></p>
      <h3>What happened today?</h3>
      <p></p>
      <h3>What am I grateful for?</h3>
      <ul><li><p></p></li></ul>
      <h3>What do I want to remember?</h3>
      <p></p>
    `,
  },
  {
    id: 'recipe',
    name: 'Recipe',
    description: 'Store recipes with ingredients and step-by-step instructions',
    icon: faUtensils,
    category: 'Personal',
    content: `
      <h2>Recipe</h2>
      <p><strong>Servings:</strong> </p>
      <p><strong>Prep time:</strong> </p>
      <p><strong>Cook time:</strong> </p>
      <h3>Ingredients</h3>
      <ul><li><p></p></li></ul>
      <h3>Instructions</h3>
      <ol><li><p></p></li></ol>
      <h3>Notes</h3>
      <p></p>
    `,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm Session',
    description: 'Capture ideas freely, then organize and prioritize',
    icon: faLightbulb,
    category: 'Personal',
    content: `
      <h2>Brainstorm Session</h2>
      <p><strong>Topic:</strong> </p>
      <h3>Ideas</h3>
      <ul><li><p></p></li></ul>
      <h3>Grouping / Themes</h3>
      <ul><li><p></p></li></ul>
      <h3>Top Picks</h3>
      <ol><li><p></p></li></ol>
      <h3>Next Steps</h3>
      <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>
    `,
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ['Work', 'Planning', 'Learning', 'Personal'];
