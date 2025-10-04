// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20}   from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title USDC (Mock) - ERC20 con 6 decimales, minteo público para testing
contract USDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    /// @param _name   Nombre (ej: "Better USD")
    /// @param _symbol Símbolo (ej: "bUSD")
    /// @param _initialSupplyWhole Supply inicial en tokens enteros (sin decimales)
    /// @param _owner  Owner del contrato y receptor del supply inicial
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupplyWhole,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        _mint(_owner, _toUnits(_initialSupplyWhole));
    }

    /// 6 decimales (estilo USDC)
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /// 👇 Mint público: cualquiera puede mintearse `amountWhole` a sí mismo.
    ///    ÚSALO SOLO EN AMBIENTES DE PRUEBA.
    function mint(uint256 amountWhole) external {
        _mint(msg.sender, _toUnits(amountWhole));
    }

    /// Utilidad: tokens enteros -> unidades mínimas (6 decimales)
    function _toUnits(uint256 whole) internal pure returns (uint256) {
        return whole * (10 ** _DECIMALS);
    }
}