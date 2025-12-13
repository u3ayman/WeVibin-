import { socketService } from './socket';

const peerConnections = new Map<string, RTCPeerConnection>();
const audioElements = new Map<string, HTMLAudioElement>();

const configuration: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

let localStream: MediaStream | null = null;

export async function initializeWebRTC() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone access granted');
    return true;
  } catch (error) {
    console.error('Failed to get microphone access:', error);
    return false;
  }
}

export async function createPeerConnection(
  peerId: string,
  initiator: boolean = false
): Promise<RTCPeerConnection> {
  // Close existing connection if any
  closePeerConnection(peerId);

  const pc = new RTCPeerConnection(configuration);

  // Add local audio track
  if (localStream) {
    localStream.getTracks().forEach(track => {
      if (localStream) {
        pc.addTrack(track, localStream);
      }
    });
  }

  // Handle incoming tracks
  pc.ontrack = (event) => {
    console.log('Received remote track from', peerId);
    const audioElement = new Audio();
    audioElement.srcObject = event.streams[0];
    audioElement.play();
    audioElements.set(peerId, audioElement);
  };

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socketService.emit('ice-candidate', {
        to: peerId,
        candidate: event.candidate,
      });
    }
  };

  // Handle connection state changes
  pc.onconnectionstatechange = () => {
    console.log(`Connection state with ${peerId}:`, pc.connectionState);
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      closePeerConnection(peerId);
    }
  };

  peerConnections.set(peerId, pc);

  // If initiator, create and send offer
  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketService.emit('offer', { to: peerId, offer });
  }

  return pc;
}

export async function handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
  try {
    let pc = peerConnections.get(peerId);
    if (!pc) {
      pc = await createPeerConnection(peerId, false);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketService.emit('answer', { to: peerId, answer });
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

export async function handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
  try {
    const pc = peerConnections.get(peerId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error handling answer:', error);
  }
}

export function handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
  try {
    const pc = peerConnections.get(peerId);
    if (!pc) return;

    pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error('Error handling ICE candidate:', error);
  }
}

export function closePeerConnection(peerId: string) {
  const pc = peerConnections.get(peerId);
  if (pc) {
    pc.close();
    peerConnections.delete(peerId);
  }

  const audioElement = audioElements.get(peerId);
  if (audioElement) {
    audioElement.pause();
    audioElement.srcObject = null;
    audioElements.delete(peerId);
  }
}

export function closeAllConnections() {
  peerConnections.forEach((pc, peerId) => {
    closePeerConnection(peerId);
  });
}

export function setMicrophoneEnabled(enabled: boolean) {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }
}

export function cleanupWebRTC() {
  closeAllConnections();
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
}
