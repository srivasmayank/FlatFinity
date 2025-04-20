import React, { useState } from "react";
import StepOTP from "../Steps/StepOTP";

const steps = {
  //1: StepPhoneEmail,
  1: StepOTP,
};
const Authenticate = () => {
  function onNext() {
    setStep(step + 1);
  }

  const [step, setStep] = useState(1);
  const Step = steps[step];

  return <Step onNext={onNext} />;
};

export default Authenticate;
