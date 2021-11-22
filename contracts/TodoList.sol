pragma solidity >=0.4.22 <0.9.0;

contract TodoList {
    uint public taskCount = 0; //State variable, actually written to the blockchain

    struct Task {
        uint id;
        string content;
        bool completed;
    }

    mapping(uint => Task) public tasks;

    event TaskCreated(uint id, string content, bool completed);

    event TaskCompleted(uint id, bool completed);

    constructor() public {
        createTask("Check out trollTheTrolls.com");
    }

    function createTask(string memory _content) public {
        taskCount ++;
        tasks[taskCount] = Task(taskCount, _content, false);
        emit TaskCreated(taskCount, _content, false);
    }

    function toggleCompleted(uint _id) public {
        Task memory _task = tasks[_id]; // This is how you create a task in memory
        _task.completed = !_task.completed;
        tasks[_id] = _task; //done this way as the tasks in the array themselves are immutable.
        emit TaskCompleted(_id, _task.completed);
    }
}