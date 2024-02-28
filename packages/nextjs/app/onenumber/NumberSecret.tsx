import React, { useEffect, useState } from "react";
import { COST_INDEX } from "./Game";
import { ethers } from "ethers";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { InputBase } from "~~/components/scaffold-eth";
import { GenericContract } from "~~/utils/scaffold-eth/contract";

interface NumberSecretProps {
  gameId: number;
  game: bigint[];
  oneNumberContract: GenericContract;
  isBiddingPhase: boolean;
}

export const NumberSecret = ({ gameId, game, oneNumberContract, isBiddingPhase }: NumberSecretProps) => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const [number, setNumber] = useState<number | null>(null);
  const [secret, setSecret] = useState<string>("");

  const [blindedNumber, setBlindedNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!number || !secret) {
      setBlindedNumber(null);

      return;
    }

    setBlindedNumber(ethers.utils.solidityKeccak256(["uint256", "string"], [number, secret]));
  }, [number, secret]);

  const handleChangeNumber = (newValue: string) => {
    const number = parseInt(newValue);

    if (!Number.isNaN(number) && number > 0) {
      setNumber(number);
    } else {
      setNumber(null);
    }
  };

  const handleChangeSecret = (newValue: string) => {
    setSecret(newValue);
  };

  return (
    <>
      <div>NumberSecret</div>

      <div>{blindedNumber && blindedNumber}</div>

      <div>
        <InputBase onChange={handleChangeNumber} placeholder={"Number"} value={number ? number.toString() : ""} />
      </div>
      <div>
        <InputBase onChange={handleChangeSecret} placeholder={"Secret"} value={secret} />
      </div>

      <div>
        <button
          className="btn btn-primary btn-sm"
          disabled={!blindedNumber}
          onClick={async () => {
            console.log("yo");

            if (isBiddingPhase) {
              const { request } = await publicClient.simulateContract({
                account: address,
                address: oneNumberContract.address,
                abi: oneNumberContract.abi,
                functionName: "setBlindedNumber",
                value: game[COST_INDEX] ?? 0n,
                args: [gameId],
              });

              if (walletClient) {
                await walletClient.writeContract(request);
              }
            } else {
              const { request } = await publicClient.simulateContract({
                account: address,
                address: oneNumberContract.address,
                abi: oneNumberContract.abi,
                functionName: "revealNumber",
                args: [gameId],
              });

              if (walletClient) {
                await walletClient.writeContract(request);
              }
            }
          }}
          type="button"
        >
          {isBiddingPhase ? "Submit Blinded Number" : "Reveal Number"}
        </button>
      </div>
    </>
  );
};