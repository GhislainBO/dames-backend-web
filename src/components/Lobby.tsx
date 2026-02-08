import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  isPrivate: boolean;
}

interface Player {
  id: string;
  username: string;
  color?: 'white' | 'black';
  isReady: boolean;
}

interface LobbyProps {
  onJoinRoom: (roomId: string, playerId: string, players: Player[]) => void;
  onBack: () => void;
}

function Lobby({ onJoinRoom, onBack }: LobbyProps) {
  const { socket, isConnected } = useSocket();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [username, setUsername] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Écouter les mises à jour des rooms
    socket.on('roomList', (roomList: RoomInfo[]) => {
      setRooms(roomList);
    });

    socket.on('roomCreated', (room: RoomInfo) => {
      setRooms((prev) => [...prev, room]);
    });

    socket.on('roomUpdated', (room: RoomInfo) => {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    });

    socket.on('roomDeleted', (roomId: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    });

    socket.on('joinedRoom', (data: { room: any; playerId: string }) => {
      onJoinRoom(data.room.id, data.playerId, data.room.players || []);
    });

    socket.on('error', (message: string) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    // Récupérer la liste des rooms
    socket.emit('getRooms');

    return () => {
      socket.off('roomList');
      socket.off('roomCreated');
      socket.off('roomUpdated');
      socket.off('roomDeleted');
      socket.off('joinedRoom');
      socket.off('error');
    };
  }, [socket, onJoinRoom]);

  const handleCreateRoom = () => {
    if (!socket || !username.trim() || !newRoomName.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    socket.emit('createRoom', {
      name: newRoomName.trim(),
      username: username.trim(),
      settings: {
        isPrivate: false,
        timeControl: null,
      },
    });

    setShowCreateForm(false);
    setNewRoomName('');
  };

  const handleJoinRoom = (roomId: string) => {
    if (!socket || !username.trim()) {
      setError('Veuillez entrer un pseudo');
      return;
    }

    socket.emit('joinRoom', {
      roomId,
      username: username.trim(),
    });
  };

  return (
    <div className="lobby">
      <h2>Multijoueur en ligne</h2>

      {!isConnected && (
        <div className="connection-status error">
          Connexion au serveur en cours...
        </div>
      )}

      {isConnected && (
        <div className="connection-status success">
          Connecté au serveur
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="username-input">
        <label>Votre pseudo :</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Entrez votre pseudo"
          maxLength={20}
        />
      </div>

      <div className="lobby-actions">
        <button
          className="btn primary"
          onClick={() => setShowCreateForm(true)}
          disabled={!isConnected}
        >
          Créer une partie
        </button>
        <button className="btn secondary" onClick={onBack}>
          Retour au menu
        </button>
      </div>

      {showCreateForm && (
        <div className="create-room-form">
          <h3>Nouvelle partie</h3>
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Nom de la partie"
            maxLength={30}
          />
          <div className="form-actions">
            <button className="btn primary" onClick={handleCreateRoom}>
              Créer
            </button>
            <button
              className="btn secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="rooms-list">
        <h3>Parties disponibles</h3>
        {rooms.length === 0 ? (
          <p className="no-rooms">Aucune partie disponible. Créez-en une !</p>
        ) : (
          <ul>
            {rooms.map((room) => (
              <li key={room.id} className="room-item">
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  <span className="room-players">
                    {room.playerCount}/{room.maxPlayers} joueurs
                  </span>
                  <span className={`room-status ${room.status}`}>
                    {room.status === 'waiting' ? 'En attente' : 'En cours'}
                  </span>
                </div>
                <button
                  className="btn join"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={
                    room.playerCount >= room.maxPlayers ||
                    room.status !== 'waiting' ||
                    !isConnected
                  }
                >
                  Rejoindre
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Lobby;
