function listOpenAccessFiles() {
  var users_with_errors = [];
  var files = DriveApp.getFiles();
  for(var i=0; i<50; i++) {
    var file_ok = true;
    var file = files.next();
    var owner = file.getOwner();
    var new_file_error = {};
    new_file_error.file_name = file.getName();
    new_file_error.file_url = file.getUrl().trim();
    new_file_error.errors = [];

    // get parent
    var fi = file.getParents();
     if (fi.hasNext()) {
       var parent = fi.next();
       new_file_error.parent_name = parent.getName();
       new_file_error.parent_url = parent.getUrl();
     } else {
       new_file_error.parent_name = null;
     }

    // check sharing access
    try {
      new_file_error.access = file.getSharingAccess();
      if (file.getSharingAccess() == DriveApp.Access.ANYONE) {
        file_ok = false;
      }
    } catch (err) {
      Logger.log("error: "+ err);
      file_ok = false;
      new_file_error.errors.push(err);
    }

    // check whether shared to ext. users
    var users = file.getEditors();
    new_file_error.external_editors= [];
    for (var j=0; j< users.length; j++) {
      var u = users[j];
      if (u.getDomain() != "rga.com") {
        new_file_error.external_editors.push(u.getEmail());
      }
    }
    var users = file.getViewers();
    new_file_error.external_viewers= [];
    for (var j=0; j< users.length; j++) {
      var u = users[j];
      if (u.getDomain() != "rga.com") {
        new_file_error.external_viewers.push(u.getEmail());
      }
    }
    if (new_file_error.external_editors.length>0 || new_file_error.external_viewers.length>0 ) {
      file_ok = false;
      new_file_error.errors.push("File shared to external domains: "+new_file_error.external_editors.join(", "));
    }

    // DONE
    if (!file_ok) {
      if (! (owner.getEmail() in users_with_errors) ) {
        users_with_errors[ owner.getEmail() ] = [];
      }
      users_with_errors[ owner.getEmail() ].push ( new_file_error );
      Logger.log("added file error for "+owner.getEmail() + " total: "+users_with_errors[ owner.getEmail() ].length );
    }
  }

  var keys = Object.keys(users_with_errors);

  var ssNew = SpreadsheetApp.create("Drive Report", 50, 6);
  ssNew.appendRow(["Owner", "File", "Parent", "Access", "External Editors", "External Viewers"]);
  ssNew.getRange("A1:F1").setBackground("#3333CC").setFontColor("#FFFFFF").setFontStyle("Bold").setBorder(false, false, true, false, false, true);

  for (var i=0; i<keys.length; i++) {
    var user_errors = users_with_errors[keys[i]];

    for (var k=0; k<user_errors.length; k++) {
      var user_errors = user_errors[k];
      ssNew.appendRow([ keys[i],
                       '=HYPERLINK("'+user_errors.file_url+'","'+user_errors.file_name+'")',
                       (user_errors.parent_name != null)?'=HYPERLINK("'+user_errors.parent_url+'","'+user_errors.parent_name+'")':"",
                       user_errors.access,
                       user_errors.external_editors.join("\n"),
                       user_errors.external_viewers.join("\n")
                      ]);
    }
  }
  ssNew.getRange("D1").setWrap(true);
  ssNew.autoResizeColumn(1);
  ssNew.autoResizeColumn(2);
  ssNew.autoResizeColumn(3);
  ssNew.autoResizeColumn(4);
  ssNew.autoResizeColumn(5);
  ssNew.autoResizeColumn(6);
  Logger.log("URL: "+ ssNew.getUrl());

  /*var recipient = Session.getActiveUser().getEmail();
  var subject = "Drive Sharing report";
  var body = message;
  MailApp.sendEmail(recipient, subject, body);*/

}
