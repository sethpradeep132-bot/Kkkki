let activeAITasks = [{ task: 'AUTO_ANNOUNCE', intervalSeconds: 5 }];
let task = 'AUTO_ANNOUNCE';
activeAITasks = activeAITasks.filter(t => t !== task && t.task !== task);
console.log(activeAITasks);
