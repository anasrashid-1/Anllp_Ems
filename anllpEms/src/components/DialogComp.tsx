import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { Dialog, Portal, Button } from "react-native-paper";
import COLORS from '../constants/colors';
import { CheckCircleIcon, ExclamationCircleIcon } from "react-native-heroicons/solid";

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}
interface ChildProps {
    dialogState: DialogState;
    setDialogState: React.Dispatch<React.SetStateAction<DialogState>>;
}

const DialogComp: React.FC<ChildProps> = ({ dialogState, setDialogState }) => {
    const renderIcon = () => {
        if (dialogState.dialogIcon === "check-circle") {
            return <CheckCircleIcon size={40} color={COLORS.PRIMARY_GREEN} />
        } else if (dialogState.dialogIcon === "alert") {
            return <ExclamationCircleIcon size={40} color={COLORS.PRIMARY_RED} />
        }
        return null;
    }



    return (
        <Portal>
            <Dialog visible={dialogState.dialogVisible} onDismiss={() => setDialogState({ ...dialogState, dialogVisible: false })} style={styles.dialog}>
                <Dialog.Icon icon={renderIcon}/>
                <Dialog.Content style={{ marginTop: 30 }}>
                    <Text>{dialogState.dialogMessage}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setDialogState({ ...dialogState, dialogVisible: false })} labelStyle={{ color: COLORS.ACCENT_ORANGE }}>OK</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    )
}


const styles = StyleSheet.create({
    dialog: {
        backgroundColor: 'white',
        borderRadius: 8,
    }
})

export default DialogComp


