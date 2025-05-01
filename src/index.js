#!/usr/bin/env node

const {program} = require("commander");
const {initDb} = require("./db.js")
const chalk = require("chalk");
const {addTasks,updateTasks,listTasks} = require("./commands.js");

const init = async () => {
    try{
        await initDb();

        program
        .name("taskman")
        .description("A CLI based Task-Manager")
        .version("1.0.0")

        program
        .command("add")
        .description("Add task")
        .action(addTasks)

        program
        .command("update <id>")
        .description("Update task")
        .action(updateTasks)

        program
        .command("list")
        .description("List all tasks")
        .option("-s , --status <statuss>","Fliter task by status (pending,in-progress,completed)")
        .option("-d , --due_date <dueDate>","Filter task by due date (YYYY-MM-DD")
        .action(listTasks)

        program.parse(process.argv)

        if(process.argv <= 2){
            program.help();
        }

    }
    catch(err){
        console.log(chalk.red("Error Initialining Program:",err))
    }
    
}

init();