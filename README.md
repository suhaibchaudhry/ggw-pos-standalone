Dyart Labs POS distribution configuration.

Install Plymouth Theme:
cp --recursive themes/dyartlabs-logo /lib/plymouth/themes
sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.plymouth /etc/alternatives/default.plymouth
sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.grub /etc/alternatives/default.plymouth.grub