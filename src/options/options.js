/**
 * Javascript for options page.
 */

var DOWNLOADING = "正在下载在线规则...";
var storage = {};


/* Move a row up or down */
function moveUpOrDown(tr, isUp) {
    var $tr = $(tr);
    var idx = $(tr).index();
    var $table = $tr.closest("table");
    var arr = null;
    var tmp = null;
    if ($table.is($("#tblOnlineURLs"))) {
        arr = storage.onlineURLs;
    }
    else if ($table.is($("#tblCustomRules"))) {
        arr = storage.customRules;
    }
    if (isUp) {
        var $prev = $tr.prev();
        if ($prev) {
            $prev.before($tr);
            tmp = arr[idx - 1];
            arr[idx - 1] = arr[idx];
            arr[idx] = tmp;
        }
    } else {
        var $next = $tr.next();
        if ($next) {
            $next.after($tr);
            tmp = arr[idx + 1];
            arr[idx + 1] = arr[idx];
            arr[idx] = tmp;
        }
    }
}

/* Move up */
function moveUp(tr) {
    return moveUpOrDown(tr, true);
}

/* Move down */
function moveDown(tr) {
    return moveUpOrDown(tr, false);
}


/* Create a url row */
function createURLRow(rule) {
    // https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/DOM_Building_and_HTML_Insertion
    $("#tblOnlineURLs tbody").append(
        $("<tr>").append(
            $("<td>").append($("<input>", {type: "checkbox"}).addClass("checkbox")),
            $("<td>").append($("<input>", {type: "text"}).addClass("form-control").change(function () {
                var ele = this;
                var url = $.trim($(this).val());
                var hasSame = false;
                $(this).closest("tbody").find("input[type='text']").each(function () {
                    var another = $.trim($(this).val());
                    if (ele != this && url == another) {
                        // Same online urls
                        hasSame = true;
                        return false;
                    }
                });
                if (!hasSame) {
                    $(this).data("old", url);
                    var idx = $(this).closest("tr").index();
                    storage.onlineURLs[idx].url = $(this).val();
                } else {
                    // Don't change url if already has a same url.
                    $(this).val($(this).data("old"));
                }
            }).val(rule.url).data("old", rule.url)),
            $("<td>").width("60px").append($("<a>").addClass("btn btn-xs btn-info").click(function () {
                var url = $(this).closest("tr").find(":text").val();
                if ($.trim(url)) {
                    browser.tabs.create({url: url});
                }
            }).text("查看")),
            $("<td>").append(
                $("<input>", {type: "checkbox"}).addClass("checkbox middle").prop("checked", rule.enable).change(function () {
                    var idx = $(this).closest("tr").index();
                    storage.onlineURLs[idx].enable = $(this).is(":checked");
                })
            ),
            $("<td>").append(
                $("<button>").addClass("btn btn-xs btn-info").append(
                    $("<span>").addClass("glyphicon glyphicon-chevron-up")
                ).click(function () {
                    moveUp($(this).closest("tr"));
                }),
                $("<button>").addClass("btn btn-xs btn-info").css("margin-left", "2px").append(
                    $("<span>").addClass("glyphicon glyphicon-chevron-down")
                ).click(function () {
                    moveDown($(this).closest("tr"));
                })
            )
        )
    );
}

/* Create a rule row */
function createRuleRow(rule) {
    $("#tblCustomRules tbody").append(
        $("<tr>").append(
            $("<td>").append($("<input>", {type: "checkbox"})),
            $("<td>").append($("<span>").text(rule.description)),
            $("<td>").append($("<span>").text(rule.origin)),
            $("<td>").append($("<span>").text(rule.target)),
            $("<td>").append(
                $("<input>", {type: "checkbox"}).prop("checked", rule.enable).change(function () {
                    var idx = $(this).closest("tr").index();
                    storage.customRules[idx].enable = $(this).is(":checked");
                }
            )),
            $("<td>").append(
                $("<button>").addClass("btn btn-xs btn-info").append(
                    $("<span>").addClass("glyphicon glyphicon-chevron-up")
                ).click(function () {
                    moveUp($(this).closest("tr"));
                }),
                $("<button>").addClass("btn btn-xs btn-info").css("margin-left", "2px").append(
                    $("<span>").addClass("glyphicon glyphicon-chevron-down")
                ).click(function () {
                    moveDown($(this).closest("tr"));
                })
            )
        )
    );
}

/* Enable or disable */
$("#chbEnable").change(function () {
    storage.enable = $("#chbEnable").is(":checked");
});

/* Download online url interval */
$("#onlineInterval").change(function () {
    storage.updateInterval = parseInt($("#onlineInterval").val() * 60);
    if (storage.updateInterval < 1 ) {
        storage.updateInterval = 1;
    }
});

/* Reset button */
$("#btnReset").click(function () {
    reload();
});

/* Save options */
$("#btnSave").click(function () {
    /* remove empty online url */
    var tmp = storage.onlineURLs;
    storage.onlineURLs = [];
    for (var i=0; i<tmp.length; i++) {
        var onlineURL = tmp[i];
        if (onlineURL.url && onlineURL.url != "") {
            storage.onlineURLs.push(onlineURL);
        }
    }
    /* remove empty custom rule */
    tmp = storage.customRules;
    storage.customRules = [];
    for (var i=0; i<tmp.length; i++) {
        var rule = tmp[i];
        if (rule.origin != "" && rule.target != "") {
            storage.customRules.push(rule)
        }
    }
    /* save */
    save({"storage": storage});
});

/* Display All */
function displayAll() {
    var checkAll = $("table thead").find(":checkbox");
    checkAll.prop("checked", false);

    sendMessage("isDownloading", {}, function (response) {
        if (!response) {
            $("#downloadState").text("");
        } else {
            $("#downloadState").text(DOWNLOADING);
        }
    });

    var manifest = browser.runtime.getManifest();
    $("h1 a").attr("href", manifest.homepage_url);

    if (storage.updateInterval) {
        var intervalMinutes = Math.round(storage.updateInterval / 60);
        $("select").val(intervalMinutes);
    }
    if (storage.updatedAt) {
        var updatedAt = new Date(storage.updatedAt);
        $("#lblUpdatedAt").text(updatedAt.toLocaleString())
    }
    if (storage.enable !== undefined) {
        $("#chbEnable").attr("checked", storage.enable);
    }
    /* online urls */
    var body = $("#tblOnlineURLs tbody");
    body.empty();
    if (storage.onlineURLs) {
        for (var i = 0; i < storage.onlineURLs.length; i++) {
            var onlineURL = storage.onlineURLs[i];
            createURLRow(onlineURL);
        }
    }
    /* custom rules */
    body = $("#tblCustomRules tbody");
    body.empty();
    if (storage.customRules) {
        for (var i = 0; i < storage.customRules.length; i++) {
            var rule = storage.customRules[i];
            createRuleRow(rule);
        }
    }
}

/* Check all and uncheck all */
$("table thead :checkbox").click(function () {
    var checked = $(this).is(":checked");
    var table = $(this).closest("table");
    table.find("tbody tr").each(function () {
        $(this).find(":checkbox").first().prop("checked", checked);
    });
});

/* Add online url */
$("#btnAddOnlineURL").click(function () {
    // already has empty row
    var hasEmpty = false;
    $("#tblOnlineURLs").find(":text").each(function () {
        if ($.trim($(this).val()) == "") {
            hasEmpty = true;
            return false;
        }
    });
    if (!hasEmpty) {
        var onlineURL = {
            enable: true
        };
        storage.onlineURLs.push(onlineURL);
        createURLRow(onlineURL);
    }
});

/* Delete online url */
$("#btnDeleteOnlineURL").click(function () {
    $("#tblOnlineURLs tbody tr").each(function () {
        var rule = $(this).find(":text").val();
        if ($(this).find(":checkbox").first().is(":checked")) {
            storage.onlineURLs.removeAt($(this).closest("tr").index());
            $(this).remove();
        }
    });
    $("#tblOnlineURLs thead :checkbox").prop("checked", false);
});

/* Download in background */
$("#btnDownload").click(function () {
    sendMessage("isDownloading", {}, function (response) {
        if (!response) {
            $("#downloadState").text(DOWNLOADING);
            sendMessage("download", {});
        } else {
            $("#downloadState").text(DOWNLOADING);
        }
    });
});

var editingRule = null;

/* Add custom rule */
$("#btnAddCustomRule").click(function () {
    var hasEmpty = false;
    $("#tblCustomRules tbody tr").each(function () {
        var origin = $(this).find("span").get(1).innerText;
        var target = $(this).find("span").get(2).innerText;
        if (origin == "" && target == "") {
            hasEmpty = true;
            return false;
        }
    });
    if (!hasEmpty) {
        var rule = {
            enable: true
        };
        editingRule = null;
        showEditCustomRuleModal(rule);
    }
});

/* Edit a custom rule */
$("#btnEditCustomRule").click(function () {
    var selectedIndex = -1;
    $("#tblCustomRules tbody tr").each(function (i) {
        var $selected = $(this).find("input[type='checkbox']").first();
        if ($selected.is(":checked")) {
            selectedIndex = i;
            return false;
        }
    });
    if (selectedIndex >= 0) {
        var rule = storage.customRules[selectedIndex];
        editingRule = rule;
        showEditCustomRuleModal(rule);
    }
});

/* Delete custom rule */
$("#btnDeleteCustomRule").click(function () {
    $("#tblCustomRules tbody tr").each(function () {
        if ($(this).find(":checkbox").first().is(":checked")) {
            storage.customRules.removeAt($(this).closest("tr").index());
            $(this).remove();
        }
    });
    $("#tblCustomRules thead :checkbox").prop("checked", false);
});

/* Show Edit custom rule modal */
function showEditCustomRuleModal(rule) {
    if (rule) {
        $("#txtDescription").val(rule.description);
        $("#txtOrigin").val(rule.origin);
        $("#txtTarget").val(rule.target);
        $("#txtExclude").val(rule.exclude);
        if (rule.methods && rule.methods.length > 0) {
            $("#cbMethodAll").prop("checked", false);
            for (var i=0; i<rule.methods.length; i++) {
                $("#cbMethod_"+rule.methods[i]).prop("checked", true);
            }
            $("#divMethods").collapse("show");
        } else {
            $("#cbMethodAll").prop("checked", true);
            $("#divMethods").collapse("hide");
        }
        if (rule.types && rule.types.length > 0) {
            $("#cbTypeAll").prop("checked", false);
            for (var i=0; i<rule.types.length; i++) {
                $("#cbType_"+rule.methods[i]).prop("checked", true);
            }
            $("#divTypes").collapse("show");
        } else {
            $("#cbTypeAll").prop("checked", true);
            $("#divTypes").collapse("hide");
        }
    } else {
        $("#txtDescription").val("");
        $("#txtOrigin").val("");
        $("#txtTarget").val("");
        $("#txtExclude").val("");
        $("#cbTypeAll").prop("checked", true);
        $("#cbMethodAll").prop("checked", true);
    }
    $("#modalEditUserRule").modal("show");
}

/* types */
$("#cbTypeAll").change(function () {
    if ($(this).is(":checked")) {
        $("#divTypes").collapse("hide");
        $("#divTypes input[type='checkbox']").prop("checked", false);
    } else {
        $("#divTypes").collapse("show");
        $("#divTypes input[type='checkbox']").prop("checked", false);
    }
});

/* methods */
$("#cbMethodAll").change(function () {
    if ($(this).is(":checked")) {
        $("#divMethods").collapse("hide");
        $("#divMethods input[type='checkbox']").prop("checked", false);
    } else {
        $("#divMethods").collapse("show");
        $("#divMethods input[type='checkbox']").prop("checked", false);
    }
});

/* confirm */
$("#btnConfirmCustomRule").click(function () {
    if (!editingRule) {
        editingRule = {
            enable: true
        };
        storage.customRules.push(editingRule);
    }
    editingRule.description = $("#txtDescription").val();
    editingRule.origin = $("#txtOrigin").val();
    editingRule.target = $("#txtTarget").val();
    editingRule.exclude = $("#txtexclude").val();
    editingRule.methods = [];
    if (!$("#cbMethodAll").is(":checked")) {
        $("#divMethods input[type='checkbox']").each(function () {
            if ($(this).is(":checked")) {
                var method = $(this).parent().text();
                editingRule.methods.push(method)
            }
        })
    }
    editingRule.types = [];
    if (!$("#cbTypeAll").is(":checked")) {
        $("#divTypes input[type='checkbox']").each(function () {
            if ($(this).is(":checked")) {
                var type = $(this).parent().text();
                editingRule.types.push(type)
            }
        })
    }
    /* update display */
    displayAll();
    $("#modalEditUserRule").modal("hide");
});

/* Initialize */
function reload() {
    load("storage", function (item) {
        if (item && item.storage) {
            storage = item.storage;
            displayAll();
        }
    });
}

reload();

/* Listen for storage changed event */
browser.storage.onChanged.addListener(function (changes, area) {
    if (area == "local") {
        window.reload();
    }
});

