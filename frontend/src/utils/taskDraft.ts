export function prepareTaskText(titleInput: string, descriptionInput: string) {
  const title = titleInput.trim();
  const description = descriptionInput.trim();
  const taskTitle = title || description.split(/\r?\n/).find((line) => line.trim())?.trim().slice(0, 255);
  if (!taskTitle) return null;

  return {
    title: taskTitle,
    description: description && description !== taskTitle ? description : undefined,
  };
}
