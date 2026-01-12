# Security Policy

## Reporting Vulnerabilities

The security of the Demiurge-Blockchain is paramount. If you discover a security vulnerability, please report it responsibly.

### Do NOT

- Open a public GitHub issue
- Disclose the vulnerability publicly before it's fixed
- Exploit the vulnerability

### Do

- Email security concerns to the maintainer
- Provide detailed reproduction steps
- Allow reasonable time for a fix

## Supported Versions

| Version | Supported |
|---------|-----------|
| main | ✅ |
| develop | ⚠️ (best effort) |

## Security Measures

### Infrastructure (Monad)

- SSH key-only authentication
- Firewall rules configured
- Regular security updates
- Monitoring and logging

### Code

- Dependency auditing
- Static analysis (Clippy)
- Input validation
- No secrets in code

### Blockchain

- CGT: 8 decimal precision enforced
- Qor ID: Cryptographic identity verification
- Consensus: Standard Substrate security model

## Known Security Considerations

1. **Private Keys**: Never commit private keys or mnemonics
2. **RPC Endpoints**: Protect sensitive RPC methods
3. **Smart Contracts**: Audit before deployment
4. **Dependencies**: Regular `cargo audit` and `npm audit`

## Contact

For security matters, contact [@Alaustrup](https://github.com/Alaustrup) directly.
