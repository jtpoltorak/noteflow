export type TreeNodeType = 'notebook' | 'section' | 'note';

export interface TreeNode {
  id: number;
  type: TreeNodeType;
  title: string;
  level: number;            // 0=notebook, 1=section, 2=note
  expandable: boolean;      // true for notebooks/sections
  parentId: number | null;  // null for notebooks
  isLastChild: boolean;     // for connector line termination
  parentIsLastChild?: boolean; // for level-2: whether parent section is last in notebook
  isLocked?: boolean;
  favoritedAt?: string | null;
}
