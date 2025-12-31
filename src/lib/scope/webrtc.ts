import type { ScopeClient } from "./client";
import type { IceCandidatePayload, WebRtcOfferRequest } from "./types";

export interface ScopeDataChannelConfig {
  label?: string;
  options?: RTCDataChannelInit;
  onOpen?: (channel: RTCDataChannel) => void;
  onClose?: (channel: RTCDataChannel) => void;
  onMessage?: (event: MessageEvent, channel: RTCDataChannel) => void;
}

export interface ScopeWebRtcSessionOptions {
  scopeClient: ScopeClient;
  initialParameters?: WebRtcOfferRequest["initialParameters"];
  setupPeerConnection?: (pc: RTCPeerConnection) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (pc: RTCPeerConnection) => void;
  dataChannel?: ScopeDataChannelConfig | null;
}

export interface ScopeWebRtcSession {
  pc: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  sessionId: string;
}

export async function createScopeWebRtcSession(
  options: ScopeWebRtcSessionOptions
): Promise<ScopeWebRtcSession> {
  const { scopeClient, initialParameters, setupPeerConnection, onTrack, onConnectionStateChange } =
    options;

  const iceConfig = await scopeClient.getIceServers();
  if (!iceConfig) {
    throw new Error("Failed to get ICE servers");
  }

  const pc = new RTCPeerConnection({ iceServers: iceConfig.iceServers });
  const pendingCandidates: IceCandidatePayload[] = [];
  let sessionId: string | null = null;

  pc.onicecandidate = async (event) => {
    if (!event.candidate) return;

    const payload: IceCandidatePayload = {
      candidate: event.candidate.candidate,
      sdpMid: event.candidate.sdpMid,
      sdpMLineIndex: event.candidate.sdpMLineIndex,
    };

    if (sessionId) {
      await scopeClient.addIceCandidates(sessionId, [payload]);
    } else {
      pendingCandidates.push(payload);
    }
  };

  if (onTrack) {
    pc.ontrack = onTrack;
  }

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => onConnectionStateChange(pc);
  }

  setupPeerConnection?.(pc);

  let dataChannel: RTCDataChannel | undefined;
  if (options.dataChannel !== null) {
    const {
      label = "parameters",
      options: channelOptions = { ordered: true },
      onOpen,
      onClose,
      onMessage,
    } = options.dataChannel ?? {};

    dataChannel = pc.createDataChannel(label, channelOptions);

    if (onOpen) {
      dataChannel.onopen = () => onOpen(dataChannel);
    }

    if (onClose) {
      dataChannel.onclose = () => onClose(dataChannel);
    }

    if (onMessage) {
      dataChannel.onmessage = (event) => onMessage(event, dataChannel);
    }
  }

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const localDesc = pc.localDescription;
  if (!localDesc?.sdp) {
    throw new Error("Failed to create local description");
  }

  const answer = await scopeClient.createWebRtcOffer({
    sdp: localDesc.sdp,
    type: localDesc.type,
    initialParameters,
  });

  if (!answer) {
    throw new Error("Failed to get answer from Scope");
  }

  await pc.setRemoteDescription({ sdp: answer.sdp, type: answer.type });
  sessionId = answer.sessionId;

  if (pendingCandidates.length > 0) {
    await scopeClient.addIceCandidates(sessionId, pendingCandidates);
    pendingCandidates.length = 0;
  }

  return { pc, dataChannel, sessionId };
}
