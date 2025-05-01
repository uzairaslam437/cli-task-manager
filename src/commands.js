// const inquirer = require('inquirer')
const {pool} = require('./db');
const chalk = require('chalk');
const { defaults } = require('pg');
const { format, parseISO } = require('date-fns');

const addTasks = async () => {
    const inquirer = await import("inquirer")
    const answers = await inquirer.default.prompt([
        {
            type: "input",
            name: "title",
            message:"title:",
            validate: (input) => input.length > 0 ? true : 'title cannot be empty'
        },
        {
            type:"input",
            name:"description",
            message:"Description:"
        },
        {
            type: "list",
            name: "status",
            message: "status:",
            choices: ["pending","in-progress","completed"],
            default: "pending"
        },
        {   
            type: "input",
            name: "dueDate",
            message: "Due date [YYYY-MM-DD,Optional]: ",
            validate: (input) => {
                if (!input) return true;
                const date = new Date(input);
                return !isNaN(date.getTime()) ? true : 'Enter date is correct format [YYYY-MM-DD]:'

            }
        }
    ]);

    try{
        console.log(answers)
        const {title,description,status,dueDate} = answers;
        const query = {
            text: `INSERT INTO tasks(title,description,status,due_date) VALUES ($1,$2,$3,$4) RETURNING *`,
            values: [title,description,status,dueDate || null]
        };
        const res = await pool.query(query);
        console.log(chalk.green('Task Added Successfully!'))
        displayTasks(res.rows[0]);
    }
    catch(err){
        console.log(chalk.red('Error Adding Task!'),err)
    }
};

const listTasks = async  (options) => {
    try{
        let query = "SELECT * FROM tasks "
        const whereConditions = [];
        const values = [];
        let paramsCount = 1;

        if(options.status){
            whereConditions.push(`status = $${paramsCount++}`);
            values.push(options.status);
        }

        if(options.due_date){
            whereConditions.push(`DATE(due_date) = DATE($${paramsCount++})`);
            values.push(options.due_date)
        }

        if(whereConditions.length > 0){
            query += " WHERE " + whereConditions.join("AND");
        }

        query += " ORDER BY due_date ASC NULLS LAST"

        const res = await pool.query(query,values);

        if(res.rows.length === 0){
            console.log(chalk.yellow("No task found"));
            return;
        }

        res.rows.forEach(row => {
            displayTasks(row);
            console.log("----------------------------");
        });
    }
    catch(err){
        console.log(chalk.red(`Error fetching tasks: ${err}`))
    }
}

const updateTasks = async (taskId) => {
    try{
        const inquirer = await import("inquirer");

        let fetchQuery = {
            text: "SELECT * FROM tasks WHERE id = $1",
            values: [taskId]
        };
    
        const task = await pool.query(fetchQuery);
    
        if(task.rows.length === 0){
            console.log(chalk.yellow(`No task found with id:${taskId}`));
            return;
        }
    
        const answers = await inquirer.default.prompt([
            {
                type: "input",
                name:"title",
                message: "title:",
                default: task.title,
                validate: (input) => input.length > 0 ? true : "Title cannot be empty:" 
            },
            {
                type: "input",
                name: "description",
                message: "description:",
                default: task.description || "",
            },
            {
                type: "list",
                name: "status",
                message: "status:",
                choices: ["pending","in-progress","completed"],
                default: task.status
            },
            {
                type:"input",
                name:"dueDate",
                message: "due date (YYYY-MM-DD,optional):",
                default: task.due_date? format(new Date(task.due-date),"yyyy-MM-dd") : "",
                validate: (input) => {
                    if(!input) return true;
                    const date = new Date(input);
                    return !isNaN(date.getTime()) ? true : "Correct format (YYYY-MM-DD):"
                }
            }
        ]);
        
        const {title,description,status,dueDate} = answers;
    
        let updateQuery = {
            text: `UPDATE tasks 
                    SET title = $1 , description = $2 , status = $3 , due_date = $4 , updated_at= CURRENT_TIMESTAMP
                    WHERE id = $5 RETURNING *`,
            values: [title,description,status,dueDate || null ,taskId]
        }
    
        const updatedRes = await pool.query(updateQuery);
    
        console.log(chalk.blue("Task has been successfully updated!"));
        displayTasks(updatedRes.rows[0]);
    }
    catch(err){
        console.log(chalk.red("Error updating task:",err))
    }
};

 const displayTasks = (task) => {
    console.log(chalk.green(`ID:${task.id}`));
    console.log(chalk.white(`Title: ${task.title}`));

    if(task.description){
        console.log(chalk.white(`Description: ${task.description}`));
    }

    const statusColor = task.status === "completed" ? chalk.green :
    task.status === "in-progress"? chalk.yellow :
    chalk.red

    console.log(statusColor(`Status: ${task.status}`));

    if(task.due_date){
        const dueDate = new Date(task.due_date);
        const formattedDate = format(dueDate,"yyyy-MM-dd");
        console.log(chalk.white(`Due: ${formattedDate}`));
    }

    const createdAt = format(new Date(task.created_at),"yyyy-MM-dd HH-mm");
    console.log(chalk.grey("Created At:",createdAt));
 }

 module.exports = {addTasks,updateTasks,listTasks}
