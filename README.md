Dyart Labs POS distribution configuration.
==========================================

Required/Optional Packages:
---------------------------
xorg-dev and libX11-dev are required to compile utilities.

node npm and nodewebkit in global space

Xorg -> Display Server

LightDM -> Display Manager

Ratpoison -> Window Manager

ifplugd -> Ethernet checker

1) Move xsessions to /usr/share/xsessions to add session a xsession to ligthDM login list.

2) Move ligthdm conf.

3) .ratpoisonrc is provided with the project. Move it to the home directly of the default POS user.

Install Plymouth Theme:
-----------------------
sudo apt-get install plymouth-theme-ubuntu-logo
sudo apt-get install plymouth-theme-text

Replace text in text.playmouth

cp --recursive themes/dyartlabs-logo /lib/plymouth/themes

sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.plymouth /etc/alternatives/default.plymouth

sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.grub /etc/alternatives/default.plymouth.grub

sudo update-initramfs -u

sudo update-grub

Deployment Todo:
----------------
Test screen count dependency

Create Base Pos User

Remove TTY1-6 and Disable keys CLTR+ALT+FN1-12 based on user

Deploy nodewebkit project as an ecrypted .nw accessible via certificate signed by Dyart labs

VirtualBox Notes:
-----------------
Packages Reccomended: virtualbox-guest-x11

X11 Icons and Cursors:
----------------------
Copy themes/icons to ~/.icons to do a user wide install
Copy themes/icons to /usr/share/icons/ for a system wide instal

Create a symbolic link named "default" pointed to the icon themes directory either in ~/.icons or /usr/share/icons
more details: https://wiki.archlinux.org/index.php/Cursor_Themes

GTK Theme:
----------
Copy themes/gtk-themes to ~/.themes to do a user wide install
Copy themes/gtk-themes to /usr/share/themes for a system wide install

Use gtk-chtheme package to change theme
more details: http://fluxbox-wiki.org/index.php?title=Using_gtk_themes

Harware:
--------
*LCD For Employee

*LCD For Customer

*Backpanel 7-bit BCD LCD for Customer Total

USB Pin Pad and Card Reader for Customer

Thermal Reciept Printer / Regular Printer (GGW will use regular printer)

USB Register

1 x Credit Card Swipers for Employee Screen (Mini USB 3TK)

USB Barcode Scanner

Internet Based Payment

Future Hardware:
----------------
Pin Pad Replacement with Cheap China Tablet / Signature input and PIN entry

Table Attached Barcode Scanner

Allow Physical Verifone Terminals to conntect via RS232 as Payment Methods