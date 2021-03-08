import scrollToFrame from "../scroll-to-frame";
import { useRef } from "react";



export default function NotificationsFrame() {
  const frame = useRef(null);

  scrollToFrame.setElement(frame);
  
  return (
    <iframe
      id="notifications-lookup"
      ref={frame}
      src="https://www3.nccourts.org/onlineservices/notifications/menu.sp"
    ></iframe>
  );
}
