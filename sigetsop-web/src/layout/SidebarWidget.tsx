import React, { useMemo } from "react";
import { binaryToText, email, reservet } from "../@core";

const SidebarWidget: React.FC = () => {
  const decodedEmail = useMemo(() => binaryToText(email), []);
  const decodedReserve = useMemo(() => binaryToText(reservet), []);

  return (
    <div
      className={`
        mx-auto mb-1 w-full max-w-60 rounded-2xl bg-lime-900 px-4 py-5 text-center dark:bg-white/[0.03]`}
    >
      <h3 className="mb-2 font-semibold text-gray-300 dark:text-white text-sm">
        {decodedEmail}
      </h3>
      <p className="mb-4 text-gray-200 dark:text-white text-sm">
        {decodedReserve}
      </p>
    </div>
  );
};

export default React.memo(SidebarWidget);
