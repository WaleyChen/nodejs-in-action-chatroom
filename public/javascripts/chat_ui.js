function displayMessage(message) {
  var newElement = $('<div></div>').text(message.text);
  $('#messages').append(newElement);
}

function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  var message = $('#send-message').val()
    , systemMessage;

  // If user input begins with a slash, treat it as a command
  if (message[0] == '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }

  // Broadcast non-command input to other users
  } else {
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
  var chatApp = new Chat(socket);

  // Display the results of a name change attempt
  socket.on('nameResult', function(result) {
    var message;

    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }

    $('#messages').append(divSystemContentElement(message));
  });

  // Display received messages
  socket.on('all', function (message) {
    displayMessage(message);
  });

  // Display the results of a room change
  socket.on('joinResult', function(result) {
    CurRoom = result.room;
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  // Display received messages
  socket.on('message', function (message) {
    displayMessage(message);
  });

    // Display list of guests in current room
  socket.on('guests', function(guestNames) {
    $('#guest-list').empty();

    for(var i = 0; i < guestNames.length; i++) {
      $('#guest-list').append(divEscapedContentElement(guestNames[i]));
    }
  });

  // Display list of rooms available
  socket.on('rooms', function(rooms) {
    $('#room-list').empty();

    for(var room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    // Highlist the current room
    $('#room-list div:contains(' + CurRoom + ')').wrap('<b></b>');

    // Allow the click of a room name to change to that room
    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  // Request list of guests in current room intermittantly
  setInterval(function() {
    socket.emit('guests', CurRoom);
  }, 1000);

  // Request list of rooms available intermittantly
  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  // Allow clicking the send button to send a chat message
  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
