"use strict";

/**
 * @author Jorge Farfan
 * @description Este archivo contiene todo lo relacionado al desafío del Sensor de Movimiento.
 */

let validate_result_code = [[], [], []],
    current_test = "test_1",
    variables = [],
    conditions = {
        test_1: false
    },
    currentCallback = null,
    validator = require("../../utils/validators/motion-validator");

$("#newVariableModal").on("hidden.bs.modal", () => {
    let new_variable = $("#new-variable")
        .val()
        .replace(/\s/g, "");
    if (new_variable === "LED" || new_variable === "SENSOR_MOVIMIENTO") {
        if (!variables.includes(new_variable)) {
            if (utils.allLetters(new_variable)) {
                currentCallback(new_variable);
                variables.push(new_variable);
                $("#new-variable").val("");
            } else {
                utils.setModalError(
                    "",
                    messages.variable(new_variable).error.msg,
                    messages.variable(new_variable).error.btn
                );
            }
        } else {
            utils.setModalError(
                "",
                messages.variable(new_variable).duplicate.msg,
                messages.variable(new_variable).duplicate.btn
            );
        }
    } else {
        if (new_variable.length == 0) {
            utils.setModalError(
                "",
                messages.variable(new_variable).empty.msg,
                messages.variable(new_variable).empty.btn
            );
        } else {
            utils.setModalError(
                "",
                messages.variable(new_variable).incorrect.msg,
                messages.variable(new_variable).incorrect.btn
            );
        }
    }
});

$("#executeCode").click(() => {
    let code = utils.formatExecuteCode(Blockly.JavaScript.workspaceToCode(workspace));
    let device = $("input:radio[name=radios]:checked").val();
    if (device !== undefined) {
        if (current_test == "test_1") {
            let validate_code = utils.esprimaValidation(code);
            if (validate_code !== "Error") {
                validate_result_code = validator.motion(validate_code.body, validate_result_code);
                let validate_result = validate_result_code.filter(
                    potentiometer_filter =>
                        potentiometer_filter["name"] === "LED" ||
                        potentiometer_filter["name"] === "SENSOR_MOVIMIENTO"
                );
                if (validate_result.length == 2) {
                    conditions[current_test] = true;
                    utils.openModalWaiting("Verificando el programa ...");
                    ipcRenderer.send("execute", {
                        code: code,
                        device: device,
                        validate_code: {
                            variable: [`LED`, `SENSOR_MOVIMIENTO`]
                        },
                        channel: "channel_one"
                    });
                    ipcRenderer.on("channel_one", (event, child_result) => {
                        if (
                            child_result == "ErrorCallBack" ||
                            child_result == "Error" ||
                            child_result == "ErrorJ5"
                        ) {
                            modalChallenges(child_result, current_test, 3, false);
                        } else {
                            let data = JSON.parse(child_result);
                            let result_filter = data.variables_status.filter(
                                led_filter =>
                                    (led_filter["custom"]["type"] === "LED" &&
                                        led_filter["pin"] === 13) ||
                                    (led_filter["custom"]["type"] === "SENSOR-MOTION" &&
                                        led_filter["pin"] === 7)
                            );
                            if (result_filter.length == 2) {
                                modalChallenges(data.status, current_test, 3, true);
                            } else {
                                modalChallenges("Error", current_test, 3, false);
                            }
                        }
                    });
                } else {
                    utils.setModalError(
                        "",
                        messages.code(1).execute_title.msg,
                        messages.code().btn
                    );
                    log(chalk.white.bgRed.bold(logs_msg.code().dont_work));
                }
            } else {
                modalErrorSyntax(
                    "Error",
                    current_test,
                    3,
                    conditions.test_1 && conditions.test_2 && conditions.test_3
                );
            }
        }
    } else {
        log(chalk.black.bgRed.bold(logs_msg.devices().dont_selected));
        utils.setModalError("", messages.devices().not_found.msg, messages.devices().not_found.btn);
    }
});

$("#openModalExecuteCode").click(() => {
    let code = utils.formatExecuteCode(Blockly.JavaScript.workspaceToCode(workspace));
    let result = utils.esprimaValidation(code);
    if (result !== "Error") {
        if (result.body.length == 0) {
            log(chalk.black.bgRed.bold(logs_msg.code().empty));
            utils.setModalError(
                "",
                messages.code().empty_execute.msg,
                messages.code().empty_execute.btn
            );
        } else {
            childProcess.devices(createSetupDevices);
        }
    } else {
        modalErrorSyntax(
            "Error",
            current_test,
            3,
            conditions.test_1 && conditions.test_2 && conditions.test_3
        );
    }
});
